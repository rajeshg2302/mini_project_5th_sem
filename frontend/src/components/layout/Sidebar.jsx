import { NavLink } from 'react-router-dom';
import {
  HiShieldCheck as ShieldIcon,
  HiSearch as SearchIcon,
  HiClock as ClockIcon,
  HiChartBar as ChartIcon,
  HiCube as CubeIcon,
  HiLightningBolt as BoltIcon,
  HiInformationCircle as InfoIcon,
  HiChartSquareBar as AnalyticsIcon,
  HiBriefcase as CasesIcon,
  HiCog as SettingsIcon,
  HiBeaker as BeakerIcon,
  HiChevronLeft,
  HiChevronRight
} from 'react-icons/hi';
import { usePreferences } from '../../context/PreferencesContext';

const navItems = [
  { path: '/', icon: <ChartIcon />, label: 'Dashboard' },
  { path: '/scan', icon: <SearchIcon />, label: 'Scanner' },
  { path: '/history', icon: <ClockIcon />, label: 'Scan History' },
  { path: '/cases', icon: <CasesIcon />, label: 'Threat Cases' },
  { path: '/analytics', icon: <AnalyticsIcon />, label: 'Threat Analytics' },
  { path: '/models', icon: <CubeIcon />, label: 'AI Model Lab' },
  { path: '/research-lab', icon: <BeakerIcon />, label: 'Research Lab' },
  { path: '/simulator', icon: <BoltIcon />, label: 'Threat Simulator' },
  { path: '/settings', icon: <SettingsIcon />, label: 'Settings' },
  { path: '/about', icon: <InfoIcon />, label: 'About PhishGuard' },
];

export default function Sidebar({ isOpen, onCloseMobile }) {
  const { prefs, updatePref } = usePreferences();
  const collapsed = !!prefs.sidebarCollapsed;

  const toggleCollapse = () => {
    updatePref('sidebarCollapsed', !collapsed);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open-mobile' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">
          <ShieldIcon />
        </div>
        <div className="logo-text-wrapper">
          <span className="logo-text">PhishGuard</span>
          <span className="logo-subtext">NEXUS CONTROL</span>
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
            title={collapsed ? item.label : undefined}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          onClick={toggleCollapse}
          className="nav-item"
          style={{ marginBottom: '8px', border: '1px solid var(--border-color)', justifyContent: 'center' }}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <span className="nav-icon">{collapsed ? <HiChevronRight /> : <HiChevronLeft />}</span>
          <span className="nav-label">{collapsed ? '' : 'Collapse Sidebar'}</span>
        </button>

        <div className="version-tag">
          <span className="version-title">PHISHGUARD v1.0</span>
          <span className="version-desc">Nexus SOC Edition</span>
        </div>
      </div>
    </aside>
  );
}
