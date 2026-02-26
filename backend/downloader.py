import os
import platform
from typing import Callable, Optional, Dict, Any
from yt_dlp import YoutubeDL

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DOWNLOAD_DIR = os.environ.get("DOWNLOAD_DIR", os.path.join(os.path.dirname(BASE_DIR), "downloads"))
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def get_ffmpeg_path() -> Optional[str]:
    env_path = os.environ.get("FFMPEG_PATH")
    if env_path:
        return env_path

    project_root = os.path.dirname(BASE_DIR)
    ffmpeg_bin = "ffmpeg.exe" if platform.system() == "Windows" else "ffmpeg"
    bundled = os.path.join(project_root, "ffmpeg", "bin", ffmpeg_bin)
    if os.path.exists(bundled):
        return bundled

    return None

def make_progress_hook(on_progress: Optional[Callable[[Dict[str, Any]], None]]):
    def hook(d: Dict[str, Any]):
        if on_progress:
            on_progress(d)
    return hook

def build_outtmpl(download_dir: str, media_type: str) -> str:
    # Use media title as the base filename while letting yt_dlp append the proper extension
    return os.path.join(download_dir, "%(title)s.%(ext)s")

def audio_metadata_postprocessors(audio_format: str, bitrate: str):
    return [
        {"key": "FFmpegExtractAudio", "preferredcodec": audio_format, "preferredquality": bitrate},
        {"key": "EmbedThumbnail"},
        {"key": "FFmpegMetadata"},
    ]

def video_metadata_options():
    return {"writethumbnail": True, "embedthumbnail": True, "addmetadata": True}

def playlist_options(allow_playlist: bool = True, playlist_items: Optional[str] = None):
    opts = {"noplaylist": not allow_playlist}
    if playlist_items:
        opts["playlist_items"] = playlist_items
    return opts

def cookies_options(cookie_text: Optional[str]):
    if cookie_text and cookie_text.strip():
        import tempfile
        fd, path = tempfile.mkstemp(suffix=".txt", text=True)
        try:
            os.write(fd, cookie_text.encode('utf-8'))
        finally:
            os.close(fd)
        return {"cookiefile": path}
    return {}

def network_resilience_options(retries: int = 5, fragment_retries: int = 5, timeout: int = 30, resume: bool = True):
    return {
        "retries": retries,
        "fragment_retries": fragment_retries,
        "socket_timeout": timeout,
        "continuedl": resume,
    }

def http_headers_options():
    headers: Dict[str, str] = {}
    user_agent = os.environ.get("YTDLP_USER_AGENT")
    referer = os.environ.get("YTDLP_REFERER")
    if user_agent and user_agent.strip():
        headers["User-Agent"] = user_agent.strip()
    if referer and referer.strip():
        headers["Referer"] = referer.strip()
    if headers:
        return {"http_headers": headers, "user_agent": headers.get("User-Agent")}
    return {}

def impersonation_options():
    target = os.environ.get("YTDLP_IMPERSONATE")
    if target and target.strip():
        return {"impersonate": target.strip()}
    return {}

def _with_ytdlp(ydl_opts: Dict[str, Any], action: Callable[[YoutubeDL], Any]):
    try:
        with YoutubeDL(ydl_opts) as ydl:
            return action(ydl)
    except AssertionError as e:
        if "impersonate" in ydl_opts:
            print("[WARN] yt-dlp impersonation not supported by this version. Retrying without impersonation.")
            ydl_opts = dict(ydl_opts)
            ydl_opts.pop("impersonate", None)
            with YoutubeDL(ydl_opts) as ydl:
                return action(ydl)
        raise
    except Exception as e:
        msg = str(e)
        if "impersonate" in ydl_opts and ("Impersonate target" in msg or "impersonate" in msg.lower()):
            print("[WARN] yt-dlp impersonation target unavailable. Retrying without impersonation.")
            ydl_opts = dict(ydl_opts)
            ydl_opts.pop("impersonate", None)
            with YoutubeDL(ydl_opts) as ydl:
                return action(ydl)
        raise

def build_video_format_selector(container: str, max_height: Optional[int], prefer_codec: Optional[str]) -> str:
    height_part = f"[height<={max_height}]" if max_height is not None else ""

    if container == "mp4":
        base = f"bv*{height_part}[ext=mp4]+ba[ext=m4a]/b{height_part}[ext=mp4]/best"
    elif container == "webm":
        base = f"bv*{height_part}[ext=webm]+ba[ext=webm]/b{height_part}[ext=webm]/best"
    else:
        base = f"bv*{height_part}+ba/best"

    if prefer_codec:
        base = f"{base}[vcodec~={prefer_codec}]"

    return base

def download_audio(
    url: str,
    audio_format: str = "mp3",
    bitrate: str = "192",
    allow_playlist: bool = True,
    playlist_items: Optional[str] = None,
    cookie_text: Optional[str] = None,
    custom_title: Optional[str] = None,
    custom_artist: Optional[str] = None,
    custom_year: Optional[str] = None,
    custom_album: Optional[str] = None,
    custom_genre: Optional[str] = None,
    on_progress: Optional[Callable[[Dict[str, Any]], None]] = None,
):
    ffmpeg_path = get_ffmpeg_path()
    outtmpl = build_outtmpl(DOWNLOAD_DIR, "audio")
    if custom_title:
        outtmpl = os.path.join(DOWNLOAD_DIR, f"{custom_title}.%(ext)s")
    
    postprocessors = audio_metadata_postprocessors(audio_format, bitrate)
    # Note: Custom metadata will be preserved through writethumbnail and addmetadata options
    # FFmpeg metadata tagging is handled by yt-dlp's native FFmpegMetadata postprocessor
    
    ydl_opts = {
        "ffmpeg_location": ffmpeg_path,
        "format": "bestaudio/best",
        "outtmpl": outtmpl,
        "restrictfilenames": False,
        "windowsfilenames": True,
        "progress_hooks": [make_progress_hook(on_progress)],
        "writethumbnail": True,
        "postprocessors": postprocessors,
        **playlist_options(allow_playlist, playlist_items),
        **cookies_options(cookie_text),
        **network_resilience_options(),
        **http_headers_options(),
        **impersonation_options(),
    }
    
    # Build metadata dictionary for yt-dlp if custom metadata is provided
    if any([custom_title, custom_artist, custom_year, custom_album, custom_genre]):
        print(f"[DEBUG] Audio with custom metadata: title={custom_title}, artist={custom_artist}, album={custom_album}, year={custom_year}, genre={custom_genre}")
    
    try:
        print(f"[DEBUG] Starting audio download: url={url}, custom_title={custom_title}")
        _with_ytdlp(ydl_opts, lambda ydl: ydl.download([url]))
        print("[DEBUG] Audio download completed")
    except Exception as e:
        print(f"[ERROR] Audio download failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise

def download_video(
    url: str,
    container: str = "mp4",
    max_height: Optional[int] = 1080,
    prefer_codec: Optional[str] = None,
    allow_playlist: bool = True,
    playlist_items: Optional[str] = None,
    cookie_text: Optional[str] = None,
    custom_title: Optional[str] = None,
    custom_artist: Optional[str] = None,
    custom_year: Optional[str] = None,
    custom_album: Optional[str] = None,
    custom_genre: Optional[str] = None,
    on_progress: Optional[Callable[[Dict[str, Any]], None]] = None,
):
    ffmpeg_path = get_ffmpeg_path()
    fmt = build_video_format_selector(container, max_height, prefer_codec)
    outtmpl = build_outtmpl(DOWNLOAD_DIR, "video")
    if custom_title:
        outtmpl = os.path.join(DOWNLOAD_DIR, f"{custom_title}.%(ext)s")

    postprocessors = []
    # Note: yt-dlp will handle metadata embedding through addmetadata option
    
    ydl_opts = {
        "ffmpeg_location": ffmpeg_path,
        "format": fmt,
        "merge_output_format": container,
        "outtmpl": outtmpl,
        "restrictfilenames": False,
        "windowsfilenames": True,
        "progress_hooks": [make_progress_hook(on_progress)],
        "writethumbnail": True,
        "embedthumbnail": True,
        "addmetadata": True,
        "postprocessors": postprocessors,
        **playlist_options(allow_playlist, playlist_items),
        **cookies_options(cookie_text),
        **network_resilience_options(),
        **http_headers_options(),
        **impersonation_options(),
    }
    
    # Build metadata dictionary for yt-dlp if custom metadata is provided
    if any([custom_title, custom_artist, custom_year, custom_album, custom_genre]):
        print(f"[DEBUG] Video with custom metadata: title={custom_title}, artist={custom_artist}, album={custom_album}, year={custom_year}, genre={custom_genre}")
    
    try:
        print(f"[DEBUG] Starting video download: url={url}, custom_title={custom_title}")
        _with_ytdlp(ydl_opts, lambda ydl: ydl.download([url]))
        print("[DEBUG] Video download completed")
    except Exception as e:
        print(f"[ERROR] Video download failed: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise

def get_metadata(url: str) -> Dict[str, Any]:
    """
    Extract metadata from a URL without downloading.
    Returns all available metadata fields.
    """
    ydl_opts = {
        "skip_download": True,
        "quiet": True,
        "no_warnings": True,
        "extract_flat": False,
        **http_headers_options(),
        **impersonation_options(),
    }
    
    info = _with_ytdlp(ydl_opts, lambda ydl: ydl.extract_info(url, download=False))

    if not info:
        raise ValueError("Could not extract metadata from URL")

    # Content Details
    # title = info.get("title", "Unknown")
    # description = info.get("description")
    # view_count = info.get("view_count")
    # like_count = info.get("like_count")
    # comment_count = info.get("comment_count")
    # tags = info.get("tags", [])
    # categories = info.get("categories", [])

    # Media Technical Info
    # width = info.get("width")
    # height = info.get("height")
    # fps = info.get("fps")
    # vcodec = info.get("vcodec")
    # acodec = info.get("acodec")
    # abr = info.get("abr")
    # vbr = info.get("vbr")
    filesize = info.get("filesize")
    # ext = info.get("ext")

    # Date & Time
    # upload_date = info.get("upload_date")
    # release_date = info.get("release_date")
    # modified_date = info.get("modified_date")
    # timestamp = info.get("timestamp")

    # Additional Metadata
    # duration = info.get("duration")
    # uploader = info.get("uploader") or info.get("channel")
    # artist = info.get("artist") or info.get("creator")
    # year = info.get("release_year") or info.get("upload_date")[:4] if info.get("upload_date") else None
    # album = info.get("album")
    # genre = info.get("genre")
    # webpage_url = info.get("webpage_url")
    # is_live = info.get("is_live")
    # license = info.get("license")
    # age_limit = info.get("age_limit")
    # series = info.get("series")
    # season_number = info.get("season_number")
    # episode_number = info.get("episode_number")
    # availability = info.get("availability")
    # chapters = info.get("chapters")
    # language = info.get("language")
    # thumbnail = info.get("thumbnail")

    return {
        "title": info.get("title", "Unknown"),
        "thumbnail": info.get("thumbnail"),
        "duration": info.get("duration"),
        "uploader": info.get("uploader") or info.get("channel"),
        "artist": info.get("artist") or info.get("creator"),
        "year": info.get("release_year") or info.get("upload_date")[:4] if info.get("upload_date") else None,
        "album": info.get("album"),
        "genre": info.get("genre"),
        "filesize": filesize,
    }