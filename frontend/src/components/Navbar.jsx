import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Icon, { initials } from './Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  async function handleLogout() {
    close();
    await logout();
    showToast('You have been logged out. See you soon!', 'info');
    navigate('/login');
  }

  return (
    <nav className="navbar navbar-expand-md navbar-dark app-navbar sticky-top">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={close}>
          <span className="brand-logo">
            <Icon name="check" size={18} strokeWidth={3} />
          </span>
          Task Tracker
        </Link>

        <button
          className="navbar-toggler border-0"
          type="button"
          aria-controls="mainNav"
          aria-expanded={open}
          aria-label="Toggle navigation"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div id="mainNav" className={`collapse navbar-collapse${open ? ' show' : ''}`}>
          {user ? (
            <>
              <ul className="navbar-nav me-auto gap-md-1 mt-2 mt-md-0">
                <li className="nav-item">
                  <NavLink className="nav-link" to="/" end onClick={close}>
                    <Icon name="list" size={16} /> Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/tasks/new" onClick={close}>
                    <Icon name="plus" size={16} /> Add task
                  </NavLink>
                </li>
              </ul>
              <div className="d-flex align-items-center gap-2 py-2 py-md-0">
                <span className="avatar" aria-hidden="true">
                  {initials(user.name)}
                </span>
                <div className="d-flex flex-column lh-sm text-white me-2">
                  <span className="small fw-semibold">{user.name}</span>
                  <span>
                    <span className={`role-chip ${isAdmin ? 'admin' : 'user'}`}>{isAdmin ? 'Admin' : 'User'}</span>
                  </span>
                </div>
                <button type="button" className="btn btn-light-glass btn-sm" onClick={handleLogout}>
                  <Icon name="logout" size={15} /> Log out
                </button>
              </div>
            </>
          ) : (
            <ul className="navbar-nav ms-auto gap-md-1">
              <li className="nav-item">
                <NavLink className="nav-link" to="/login" onClick={close}>
                  Log in
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/register" onClick={close}>
                  Register
                </NavLink>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  );
}
