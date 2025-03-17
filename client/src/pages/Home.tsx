import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Thiết kế chuyến đi trong mơ của bạn</h1>
              <p className="text-lg md:text-xl mb-8">
                Khám phá tự do với lịch trình du lịch được cá nhân hóa hoàn toàn. Bạn chọn điểm đến, chúng tôi lo phần còn lại.
              </p>
              <Link href="/trip-planner">
                <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50">
                  Bắt đầu lập kế hoạch
                  <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </Link>
            </div>
            <div className="md:w-1/2">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-orange-500 rounded-lg opacity-20"></div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-500 rounded-lg opacity-20"></div>
                <img 
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                  alt="Beach destination" 
                  className="rounded-lg shadow-xl relative z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Cách thức hoạt động</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Chỉ với vài bước đơn giản, bạn đã có thể tạo ra một chuyến đi hoàn hảo theo ý muốn
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-lg">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Chọn điểm đến</h3>
              <p className="text-neutral-600">
                Chọn điểm xuất phát, điểm đến, ngày đi và về cùng các thông tin cơ bản cho chuyến đi
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-lg">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Tùy chỉnh lịch trình</h3>
              <p className="text-neutral-600">
                Dễ dàng thêm điểm tham quan, thay đổi phương tiện di chuyển, khách sạn theo nhu cầu của bạn
              </p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-blue-600 font-bold text-lg">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Đặt và tận hưởng</h3>
              <p className="text-neutral-600">
                Hoàn tất đặt chỗ với giá trọn gói minh bạch và bắt đầu chuyến phiêu lưu của bạn
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Destinations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Điểm đến phổ biến</h2>
            <p className="text-neutral-600 max-w-2xl mx-auto">
              Khám phá những điểm đến được yêu thích nhất của chúng tôi
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Phú Quốc",
                image: "https://images.unsplash.com/photo-1540202404-1b927e27fa8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400",
                desc: "Đảo ngọc với những bãi biển trắng tinh"
              },
              {
                name: "Đà Lạt",
                image: "https://images.unsplash.com/photo-1558024452-375a53739c24?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400",
                desc: "Thành phố sương mù lãng mạn"
              },
              {
                name: "Hạ Long",
                image: "https://images.unsplash.com/photo-1573270695497-69fa93e7c077?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400",
                desc: "Kỳ quan thiên nhiên thế giới"
              },
              {
                name: "Nha Trang",
                image: "https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400",
                desc: "Thiên đường biển xanh cát trắng"
              }
            ].map((destination, index) => (
              <div key={index} className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="h-48 overflow-hidden">
                  <img 
                    src={destination.image} 
                    alt={destination.name} 
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{destination.name}</h3>
                  <p className="text-neutral-600 text-sm mb-3">{destination.desc}</p>
                  <Link href="/trip-planner">
                    <a className="text-blue-600 text-sm font-medium flex items-center hover:text-blue-700">
                      Khám phá ngay
                      <svg className="w-4 h-4 ml-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Sẵn sàng cho chuyến đi tiếp theo?</h2>
          <p className="text-neutral-600 max-w-2xl mx-auto mb-8">
            Hãy để chúng tôi giúp bạn lập kế hoạch cho một chuyến đi đáng nhớ với những trải nghiệm tuyệt vời
          </p>
          <Link href="/trip-planner">
            <Button size="lg" className="bg-primary hover:bg-blue-700">
              Tạo lịch trình ngay
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
