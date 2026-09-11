import { NavLink } from 'react-router-dom';
import {
  HiShieldCheck as ShieldIcon,
  HiSearch as SearchIcon,
  HiClock as ClockIcon,
  HiChartBar as ChartIcon,
  HiCube as CubeIcon,
  HiLightningBolt as BoltIcon,
  HiInformationCircle as InfoIcon,
  HiChartSquareBar as AnalyticsIcon
} from 'react-icons/hi';

const navItems = [
  { path: '/', icon: <ChartIcon />, label: 'Dashboard' },
  { path: '/scan', icon: <SearchIcon />, label: 'Scanner' },
  { path: '/history', icon: <ClockIcon />, label: 'Scan History' },
  { path: '/analytics', icon: <AnalyticsIcon />, label: 'Threat Analytics' },
  { path: '/models', icon: <CubeIcon />, label: 'AI Model Lab' },
  { path: '/simulator', icon: <BoltIcon />, label: 'Threat Simulator' },
  { path: '/about', icon: <InfoIcon />, label: 'About PhishGuard' },
];

export default function Sidebar({ isOpen, onCloseMobile }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open-mobile' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <ShieldIcon />
        </div>
        <div className="logo-text-wrapper">
          <span className="logo-text">PhishGuard</span>
          <span className="logo-subtext">AI THREAT ENGINE</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onCloseMobile}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="version-tag">
          <span className="version-title">PHISHGUARD v1.0</span>
          <span className="version-desc">Explainable ML SOC</span>
        </div>
      </div>
    </aside>
  );
}
