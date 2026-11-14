import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

export default function NotFoundPage() {
  return (
    <div className="text-center py-5 fade-up">
      <div className="not-found-code">404</div>
      <h1 className="h4 mt-2">Oops, this page wandered off</h1>
      <p className="text-secondary mb-4">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary px-4">
        <Icon name="arrowLeft" size={16} /> Go to dashboard
      </Link>
    </div>
  );
}
