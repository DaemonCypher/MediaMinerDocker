import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import logo from '../../assets/logo.png'
import './styles/NavBar.css'

export default function NavBar() {
  const navClass = (isActive: boolean) => `navbar__link${isActive ? ' navbar__link--active' : ''}`

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__bar">
          <div className="navbar__brandRow">
            <Link to="/" className="navbar__brand">
              <img src={logo} alt="MediaMiner logo" className="navbar__logo" loading="lazy" />
              <span className="navbar__brandText">MediaMiner</span>
            </Link>
            <div className="navbar__links">
              <NavLink to="/" end className={({ isActive }) => navClass(isActive)}>Home</NavLink>
              <NavLink to="/downloads" className={({ isActive }) => navClass(isActive)}>Downloads</NavLink>
              <NavLink to="/logs" className={({ isActive }) => navClass(isActive)}>Logs</NavLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
