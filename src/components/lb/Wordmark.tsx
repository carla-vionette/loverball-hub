import { Link } from 'react-router-dom';

export default function Wordmark({ to = '/' }: { to?: string }) {
  return (
    <Link
      to={to}
      className="font-serif text-[22px] tracking-tight text-primary leading-none italic font-semibold"
    >
      loverball
    </Link>
  );
}
