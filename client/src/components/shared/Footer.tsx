import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-neutral-700 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4 flex items-center">
              <svg className="w-6 h-6 text-orange-500 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.01 11.22V15.71C3.01 20.2 4.81 22 9.3 22H14.69C19.18 22 20.98 20.2 20.98 15.71V11.22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 12C13.83 12 15.18 10.51 15 8.68L14.34 2H9.67L9 8.68C8.82 10.51 10.17 12 12 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18.31 12C20.33 12 21.81 10.36 21.61 8.35L21.33 5.6C20.97 3 19.97 2 17.35 2H14.3L15 9.01C15.17 10.66 16.66 12 18.31 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.64 12C7.29 12 8.78 10.66 8.94 9.01L9.16 6.8L9.64 2H6.59C3.97 2 2.97 3 2.61 5.6L2.34 8.35C2.14 10.36 3.62 12 5.64 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 17C10.33 17 9.5 17.83 9.5 19.5V22H14.5V19.5C14.5 17.83 13.67 17 12 17Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              MakeYourTrip
            </h3>
            <p className="text-neutral-300 mb-4">Đồng hành cùng bạn trên mọi hành trình khám phá thế giới tuyệt vời.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-orange-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12.0611C22 6.50451 17.5229 2 12 2C6.47715 2 2 6.50451 2 12.0611C2 17.0828 5.65684 21.2452 10.4375 22V14.9694H7.89844V12.0611H10.4375V9.84452C10.4375 7.32296 11.9305 5.93012 14.2146 5.93012C15.3088 5.93012 16.4531 6.12663 16.4531 6.12663V8.60261H15.1922C13.95 8.60261 13.5625 9.37822 13.5625 10.1747V12.0611H16.3359L15.8926 14.9694H13.5625V22C18.3432 21.2452 22 17.0828 22 12.0611Z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-orange-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7ZM9 12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12Z" />
                  <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" />
                  <path fillRule="evenodd" clipRule="evenodd" d="M5 1C2.79086 1 1 2.79086 1 5V19C1 21.2091 2.79086 23 5 23H19C21.2091 23 23 21.2091 23 19V5C23 2.79086 21.2091 1 19 1H5ZM19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-orange-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21.543 6.498C22 8.28 22 12 22 12C22 12 22 15.72 21.543 17.502C21.289 18.487 20.546 19.262 19.605 19.524C17.896 20 12 20 12 20C12 20 6.107 20 4.395 19.524C3.45 19.258 2.708 18.484 2.457 17.502C2 15.72 2 12 2 12C2 12 2 8.28 2.457 6.498C2.711 5.513 3.454 4.738 4.395 4.476C6.107 4 12 4 12 4C12 4 17.896 4 19.605 4.476C20.55 4.742 21.292 5.516 21.543 6.498ZM10 15.5L16 12L10 8.5V15.5Z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-orange-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.162 5.65593C21.3986 5.99362 20.589 6.2154 19.76 6.31393C20.6337 5.79136 21.2877 4.96894 21.6 3.99993C20.78 4.48793 19.881 4.82993 18.944 5.01493C18.3146 4.34151 17.4804 3.89489 16.5709 3.74451C15.6615 3.59413 14.7279 3.74842 13.9153 4.18338C13.1026 4.61834 12.4564 5.30961 12.0771 6.1498C11.6978 6.98999 11.6067 7.93178 11.818 8.82893C10.1551 8.74558 8.52832 8.31345 7.04328 7.56059C5.55823 6.80773 4.24812 5.75098 3.19799 4.45893C2.82628 5.09738 2.63095 5.82315 2.63199 6.56193C2.63199 8.01193 3.36999 9.29293 4.49199 10.0429C3.828 10.022 3.17862 9.84271 2.59799 9.51993V9.57193C2.59819 10.5376 2.93236 11.4735 3.54384 12.221C4.15532 12.9684 5.00647 13.4814 5.95299 13.6729C5.33661 13.84 4.6903 13.8646 4.06299 13.7449C4.32986 14.5762 4.85 15.3031 5.55058 15.824C6.25117 16.345 7.09712 16.6337 7.96999 16.6499C7.10247 17.3313 6.10917 17.8349 5.04687 18.1321C3.98458 18.4293 2.87412 18.5142 1.77899 18.3819C3.69069 19.6114 5.91609 20.2641 8.18899 20.2619C15.882 20.2619 20.089 13.8889 20.089 8.36193C20.089 8.18193 20.084 7.99993 20.076 7.82193C20.8949 7.2301 21.6016 6.49695 22.163 5.65693L22.162 5.65593Z" />
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-lg mb-4">Về chúng tôi</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-neutral-300 hover:text-white">Giới thiệu</Link></li>
              <li><Link href="/news" className="text-neutral-300 hover:text-white">Tin tức du lịch</Link></li>
              <li><Link href="/terms" className="text-neutral-300 hover:text-white">Điều khoản sử dụng</Link></li>
              <li><Link href="/privacy" className="text-neutral-300 hover:text-white">Chính sách bảo mật</Link></li>
              <li><Link href="/contact" className="text-neutral-300 hover:text-white">Liên hệ</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-lg mb-4">Dịch vụ</h4>
            <ul className="space-y-2">
              <li><Link href="/flights" className="text-neutral-300 hover:text-white">Đặt vé máy bay</Link></li>
              <li><Link href="/hotels" className="text-neutral-300 hover:text-white">Đặt phòng khách sạn</Link></li>
              <li><Link href="/combos" className="text-neutral-300 hover:text-white">Combo du lịch</Link></li>
              <li><Link href="/tours" className="text-neutral-300 hover:text-white">Tour du lịch</Link></li>
              <li><Link href="/cars" className="text-neutral-300 hover:text-white">Thuê xe</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-lg mb-4">Hỗ trợ khách hàng</h4>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-neutral-300 hover:text-white">Trung tâm trợ giúp</Link></li>
              <li><Link href="/faq" className="text-neutral-300 hover:text-white">Câu hỏi thường gặp</Link></li>
              <li><Link href="/cancellation" className="text-neutral-300 hover:text-white">Chính sách hoàn hủy</Link></li>
              <li><Link href="/payment" className="text-neutral-300 hover:text-white">Phương thức thanh toán</Link></li>
              <li className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Hotline: 1900 1234</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-neutral-600 text-neutral-400 text-sm text-center">
          © 2023 TravelJourney. Tất cả quyền được bảo lưu.
        </div>
      </div>
    </footer>
  );
}
