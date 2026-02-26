import os
import uuid
import time
import threading
import asyncio
from typing import Dict, Any, Optional, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

from backend.downloader import download_audio, download_video, get_metadata, DOWNLOAD_DIR

app = FastAPI(title="Media Miner Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

jobs: Dict[str, Dict[str, Any]] = {}
job_lock = threading.Lock()
job_threads: Dict[str, threading.Thread] = {} 

def now_ts() -> float:
    return time.time()

def safe_filename(name: str) -> str:
    name = name.replace("\\", "/")
    return name.split("/")[-1]

def list_download_files() -> List[Dict[str, Any]]:
    out = []
    if not os.path.exists(DOWNLOAD_DIR):
        return out
    for fn in sorted(os.listdir(DOWNLOAD_DIR)):
        path = os.path.join(DOWNLOAD_DIR, fn)
        if os.path.isfile(path):
            out.append({"name": fn, "size": os.path.getsize(path), "mtime": os.path.getmtime(path)})
    return out

def clear_download_files() -> int:
    removed = 0
    if not os.path.exists(DOWNLOAD_DIR):
        return removed
    for fn in os.listdir(DOWNLOAD_DIR):
        path = os.path.join(DOWNLOAD_DIR, fn)
        if os.path.isfile(path):
            try:
                os.remove(path)
                removed += 1
            except OSError:
                continue
    return removed

class AudioJobRequest(BaseModel):
    url: HttpUrl
    audio_format: str = "mp3"
    bitrate: str = "192"
    allow_playlist: bool = True
    playlist_items: Optional[str] = None
    cookie_text: Optional[str] = None
    custom_title: Optional[str] = None
    custom_artist: Optional[str] = None
    custom_year: Optional[str] = None
    custom_album: Optional[str] = None
    custom_genre: Optional[str] = None

class VideoJobRequest(BaseModel):
    url: HttpUrl
    container: str = "mp4"
    max_height: Optional[int] = 1080
    prefer_codec: Optional[str] = None
    allow_playlist: bool = True
    playlist_items: Optional[str] = None
    cookie_text: Optional[str] = None
    custom_title: Optional[str] = None
    custom_artist: Optional[str] = None
    custom_year: Optional[str] = None
    custom_album: Optional[str] = None
    custom_genre: Optional[str] = None

def push_event(job_id: str, event: Dict[str, Any]):
    with job_lock:
        job = jobs.get(job_id)
        if not job:
            print(f"[WARNING] Job {job_id} not found for event {event}")
            return
        job["events"].append(event)
        if len(job["events"]) > 5000:
            job["events"] = job["events"][-2000:]
        job["last_event_at"] = now_ts()
        print(f"[DEBUG] Pushed event type={event.get('type')} for job {job_id}")

def run_audio_job(job_id: str, payload: Dict[str, Any]): 
    try:
        with job_lock:
            jobs[job_id]["status"] = "running"
            jobs[job_id]["started_at"] = now_ts()

        def on_progress(d: Dict[str, Any]): 
            # Check if job was stopped
            with job_lock:
                current_status = jobs[job_id].get("status")
            if current_status == "stopped":
                raise Exception("Download cancelled by user")
            
            print(f"[DEBUG] Audio on_progress: status={d.get('status')}")
            status = d.get("status")
            if status == "downloading":
                print(f"[DEBUG] Audio progress: _percent_str={repr(d.get('_percent_str'))}, _percent={d.get('_percent')}")
            push_event(job_id, {
                "type": "progress",
                "status": d.get("status"),
                "percent": (d.get("_percent_str") or "").strip() or f"{d.get('_percent', 0):.1f}%",
                "speed": (d.get("_speed_str") or "").strip(),
                "eta": (d.get("_eta_str") or "").strip(),
                "filename": d.get("filename"),
            })

        download_audio(
            url=str(payload["url"]),
            audio_format=payload["audio_format"],
            bitrate=payload["bitrate"],
            allow_playlist=payload["allow_playlist"],
            playlist_items=payload.get("playlist_items"),
            cookie_text=payload.get("cookie_text"),
            custom_title=payload.get("custom_title"),
            custom_artist=payload.get("custom_artist"),
            custom_year=payload.get("custom_year"),
            custom_album=payload.get("custom_album"),
            custom_genre=payload.get("custom_genre"),
            on_progress=on_progress,
        )

        with job_lock:
            jobs[job_id]["status"] = "finished"
            jobs[job_id]["finished_at"] = now_ts()
        print(f"[DEBUG] Pushing finished event for job {job_id}")
        push_event(job_id, {"type": "status", "status": "finished"})

    except Exception as e:
        error_msg = str(e)
        is_cancelled = "cancelled" in error_msg.lower()
        with job_lock:
            jobs[job_id]["status"] = "stopped" if is_cancelled else "error"
            jobs[job_id]["error"] = error_msg
            jobs[job_id]["finished_at"] = now_ts()
        if not is_cancelled:
            push_event(job_id, {"type": "error", "message": error_msg})

def run_video_job(job_id: str, payload: Dict[str, Any]):
    try:
        with job_lock:
            jobs[job_id]["status"] = "running"
            jobs[job_id]["started_at"] = now_ts()

        def on_progress(d: Dict[str, Any]):
            # Check if job was stopped
            with job_lock:
                current_status = jobs[job_id].get("status")
            if current_status == "stopped":
                raise Exception("Download cancelled by user")
            
            print(f"[DEBUG] Video on_progress: status={d.get('status')}")
            status = d.get("status")
            if status == "downloading":
                print(f"[DEBUG] Video progress: _percent_str={repr(d.get('_percent_str'))}, _percent={d.get('_percent')}")
            push_event(job_id, {
                "type": "progress",
                "status": d.get("status"),
                "percent": (d.get("_percent_str") or "").strip() or f"{d.get('_percent', 0):.1f}%",
                "speed": (d.get("_speed_str") or "").strip(),
                "eta": (d.get("_eta_str") or "").strip(),
                "filename": d.get("filename"),
            })

        download_video(
            url=str(payload["url"]),
            container=payload["container"],
            max_height=payload.get("max_height"),
            prefer_codec=payload.get("prefer_codec"),
            allow_playlist=payload["allow_playlist"],
            playlist_items=payload.get("playlist_items"),
            cookie_text=payload.get("cookie_text"),
            custom_title=payload.get("custom_title"),
            custom_artist=payload.get("custom_artist"),
            custom_year=payload.get("custom_year"),
            custom_album=payload.get("custom_album"),
            custom_genre=payload.get("custom_genre"),
            on_progress=on_progress,
        )

        with job_lock:
            jobs[job_id]["status"] = "finished"
            jobs[job_id]["finished_at"] = now_ts()
        print(f"[DEBUG] Pushing finished event for job {job_id}")
        push_event(job_id, {"type": "status", "status": "finished"})

    except Exception as e:
        error_msg = str(e)
        is_cancelled = "cancelled" in error_msg.lower()
        with job_lock:
            jobs[job_id]["status"] = "stopped" if is_cancelled else "error"
            jobs[job_id]["error"] = error_msg
            jobs[job_id]["finished_at"] = now_ts()
        if not is_cancelled:
            push_event(job_id, {"type": "error", "message": error_msg})

@app.post("/api/jobs/audio")
def create_audio_job(req: AudioJobRequest):
    job_id = uuid.uuid4().hex
    payload = req.model_dump()

    with job_lock:
        jobs[job_id] = {
            "id": job_id,
            "kind": "audio",
            "status": "queued",
            "created_at": now_ts(),
            "started_at": None,
            "finished_at": None,
            "last_event_at": None,
            "error": None,
            "payload": payload,
            "events": [{"type": "status", "status": "queued"}],
        }

    thread = threading.Thread(target=run_audio_job, args=(job_id, payload), daemon=True)
    thread.start()
    job_threads[job_id] = thread
    return {"job_id": job_id}

@app.post("/api/jobs/video")
def create_video_job(req: VideoJobRequest):
    job_id = uuid.uuid4().hex
    payload = req.model_dump()

    with job_lock:
        jobs[job_id] = {
            "id": job_id,
            "kind": "video",
            "status": "queued",
            "created_at": now_ts(),
            "started_at": None,
            "finished_at": None,
            "last_event_at": None,
            "error": None,
            "payload": payload,
            "events": [{"type": "status", "status": "queued"}],
        }

    thread = threading.Thread(target=run_video_job, args=(job_id, payload), daemon=True)
    thread.start()
    job_threads[job_id] = thread
    return {"job_id": job_id}

@app.post("/api/jobs/{job_id}/stop")
def stop_job(job_id: str):
    with job_lock:
        job = jobs.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        if job["status"] in ["finished", "error", "stopped"]:
            return {"status": "already_finished", "message": f"Job already {job['status']}"}
        
        job["status"] = "stopped"
        job["finished_at"] = now_ts()
    
    push_event(job_id, {"type": "status", "status": "stopped"})
    return {"status": "stopped", "job_id": job_id}

@app.websocket("/ws/{job_id}")
async def ws_job(job_id: str, websocket: WebSocket): 
    await websocket.accept()

    with job_lock:
        job = jobs.get(job_id)
        if not job:
            await websocket.send_json({"type": "error", "message": "Job not found"})
            await websocket.close()
            return
        last_idx = len(job["events"]) - 1
        await websocket.send_json({
            "type": "snapshot",
            "job": {"id": job["id"], "kind": job["kind"], "status": job["status"], "error": job["error"]},
            "events": job["events"][-10:],
        })

    try:
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
            except asyncio.TimeoutError:
                pass
            with job_lock:
                job = jobs.get(job_id)
                if not job:
                    await websocket.send_json({"type": "error", "message": "Job not found"})
                    break
                new_events = job["events"][last_idx + 1:]
                last_idx = len(job["events"]) - 1
                status = job["status"]
                err = job["error"]

            for ev in new_events:
                await websocket.send_json(ev)

            await websocket.send_json({"type": "heartbeat", "status": status, "error": err})

    except WebSocketDisconnect:
        return

@app.get("/api/metadata")
def api_get_metadata(url: str = Query(...)):
    try:
        metadata = get_metadata(url)
        return metadata
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/files")
def api_list_files():
    return {"download_dir": DOWNLOAD_DIR, "files": list_download_files()}

@app.delete("/api/files")
@app.delete("/api/files/")
def api_clear_files():
    removed = clear_download_files()
    return {"removed": removed}

@app.get("/api/files/{filename}")
def api_get_file(filename: str):
    filename = safe_filename(filename)
    path = os.path.join(DOWNLOAD_DIR, filename)
    if not os.path.isfile(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, filename=filename)
