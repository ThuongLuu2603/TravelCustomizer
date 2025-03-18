import { Link, useLocation } from "wouter";

export default function Header() {
  const [location] = useLocation();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3.01 11.22V15.71C3.01 20.2 4.81 22 9.3 22H14.69C19.18 22 20.98 20.2 20.98 15.71V11.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 12C13.83 12 15.18 10.51 15 8.68L14.34 2H9.67L9 8.68C8.82 10.51 10.17 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.31 12C20.33 12 21.81 10.36 21.61 8.35L21.33 5.6C20.97 3 19.97 2 17.35 2H14.3L15 9.01C15.17 10.66 16.66 12 18.31 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.64 12C7.29 12 8.78 10.66 8.94 9.01L9.16 6.8L9.64 2H6.59C3.97 2 2.97 3 2.61 5.6L2.34 8.35C2.14 10.36 3.62 12 5.64 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 17C10.33 17 9.5 17.83 9.5 19.5V22H14.5V19.5C14.5 17.83 13.67 17 12 17Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="font-bold text-2xl ml-2 text-primary">MakeYourTrip</h1>
        </div>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className={`${location === '/' ? 'text-primary' : 'text-neutral-600 hover:text-primary'} transition`}>
            Trang chủ
          </Link>
          <Link href="/destinations" className={`${location === '/destinations' ? 'text-primary' : 'text-neutral-600 hover:text-primary'} transition`}>
            Điểm đến
          </Link>
          <Link href="/offers" className={`${location === '/offers' ? 'text-primary' : 'text-neutral-600 hover:text-primary'} transition`}>
            Ưu đãi
          </Link>
          <Link href="/contact" className={`${location === '/contact' ? 'text-primary' : 'text-neutral-600 hover:text-primary'} transition`}>
            Liên hệ
          </Link>
          <Link href="/login" className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
            Đăng nhập
          </Link>
        </nav>
        <button className="md:hidden text-neutral-700 focus:outline-none">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </header>
  );
}
