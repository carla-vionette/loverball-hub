import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, ArrowRight } from "lucide-react";

const ApplicationPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
          <div className="w-16 h-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-3">
            Application Under Review
          </h1>

          <p className="text-slate-600 mb-6 leading-relaxed">
            Thank you for applying to the Loverball Creator Program! Our team is reviewing your application and will get back to you shortly.
          </p>

          <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">What happens next?</h3>
            <ul className="text-sm text-slate-600 space-y-1.5">
              <li>1. Our team reviews your application</li>
              <li>2. You'll be notified when approved</li>
              <li>3. Once approved, you can post events and upload videos</li>
            </ul>
          </div>

          <Button
            onClick={() => navigate("/home")}
            className="w-full h-12 rounded-lg gap-2"
          >
            Go to Homepage
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationPending;
