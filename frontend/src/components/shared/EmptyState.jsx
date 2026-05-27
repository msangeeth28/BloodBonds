export default function EmptyState({ icon = "📋", title, subtitle }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <p className="empty-title">{title}</p>
      {subtitle && <p className="empty-sub">{subtitle}</p>}
    </div>
  );
}
