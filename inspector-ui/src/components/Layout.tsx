import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/missions", icon: "📋", label: "Missions" },
  { to: "/events", icon: "⏱", label: "Events" },
  { to: "/artifacts", icon: "📦", label: "Artifacts" },
  { to: "/evidence", icon: "🔗", label: "Evidence Graph" },
  { to: "/authority", icon: "🔑", label: "Authority" },
  { to: "/replay", icon: "🔄", label: "Replay & Snapshots" },
  { to: "/health", icon: "📊", label: "Runtime Observatory" },
];

interface LayoutProps {
  children: React.ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="app-layout">
      <aside className="sidebar" role="navigation" aria-label="Inspector navigation">
        <div className="sidebar-title">
          R-Think Inspector
          <div className="sidebar-subtitle">Read-Only Observatory</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div>RT-008C Inspector Frontend</div>
          <div className="read-only-badge">READ ONLY</div>
        </div>
      </aside>
      <main className="main-content" role="main">
        {children}
      </main>
    </div>
  );
}

export default Layout;
