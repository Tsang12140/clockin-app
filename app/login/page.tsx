import LoginForm from './LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F0F4FA] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="工厂考勤" className="mx-auto mb-3 h-16 w-16 rounded-[18px] shadow-sm" />
          <h1 className="text-[22px] font-semibold text-[#1A3A8F]">工厂考勤</h1>
          <p className="text-[13px] text-gray-400 mt-1">工资管理系统</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
