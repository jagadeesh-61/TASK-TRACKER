import Icon from './Icon.jsx';

export default function PriorityBadge({ priority }) {
  return (
    <span className={`priority-chip priority-${String(priority).toLowerCase()}`}>
      <Icon name="flag" size={12} strokeWidth={2.5} />
      {priority}
    </span>
  );
}
