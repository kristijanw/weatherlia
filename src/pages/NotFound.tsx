import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen bg-[hsl(220,20%,10%)] flex items-center justify-center text-white">
      <div className="text-center space-y-4">
        <p className="text-6xl font-bold text-white/20">404</p>
        <p className="text-xl font-semibold">Oops! Stranica nije pronađena</p>
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-primary rounded-lg text-white text-sm hover:bg-primary/80 transition-colors"
        >
          Povratak na početnu
        </Link>
      </div>
    </div>
  );
}
