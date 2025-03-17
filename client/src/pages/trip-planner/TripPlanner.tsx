import { useState } from "react";
import { ProgressSteps, ProgressStep } from "@/components/ui/progress-steps";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import StepFour from "./StepFour";
import StepFive from "./StepFive";
import { useTripContext } from "@/lib/trip-context";

export default function TripPlanner() {
  const { currentStep, setCurrentStep } = useTripContext();

  // Define steps
  const steps: ProgressStep[] = [
    { id: 1, label: "Hành trình", isActive: currentStep === 1, isCompleted: currentStep > 1 },
    { id: 2, label: "Phương tiện & Lưu trú", isActive: currentStep === 2, isCompleted: currentStep > 2 },
    { id: 3, label: "Điểm tham quan", isActive: currentStep === 3, isCompleted: currentStep > 3 },
    { id: 4, label: "Xác nhận", isActive: currentStep === 4, isCompleted: currentStep > 4 },
    { id: 5, label: "Thanh toán", isActive: currentStep === 5, isCompleted: currentStep > 5 }
  ];

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <StepOne />;
      case 2:
        return <StepTwo />;
      case 3:
        return <StepThree />;
      case 4:
        return <StepFour />;
      case 5:
        return <StepFive />;
      default:
        return <StepOne />;
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="font-bold text-3xl text-neutral-700 mb-2">Thiết kế lịch trình du lịch của riêng bạn</h1>
        <p className="text-neutral-600 max-w-2xl mx-auto">Tạo chuyến đi hoàn hảo với hành trình tùy chỉnh theo sở thích của bạn. Bạn chọn điểm đến, chúng tôi lo phần còn lại.</p>
      </div>

      {/* Progress Steps */}
      <ProgressSteps steps={steps} className="mb-8 md:w-4/5 lg:w-3/4 mx-auto" />
      
      {/* Current Step Content */}
      {renderStep()}
    </main>
  );
}
