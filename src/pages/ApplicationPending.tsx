import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, CheckCircle, Home, ArrowRight } from "lucide-react";

const ApplicationPending = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 20 }}
        className="max-w-md w-full text-center"
      >
        {/* Illustration */}
        <div className="relative mx-auto mb-8 w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          <div className="absolute inset-2 rounded-full bg-primary/20 flex items-center justify-center">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: 10 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 2 }}
            >
              <CheckCircle className="w-16 h-16 text-primary" strokeWidth={1.5} />
            </motion.div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-3">Application Submitted!</h1>
        <p className="text-muted-foreground text-base mb-2">
          Thanks for applying to join Loverball as a creator.
        </p>
        <p className="text-muted-foreground text-sm mb-8">
          Our team will review your application within{" "}
          <span className="font-semibold text-foreground">24–48 hours</span>.
          We'll notify you by email once a decision is made.
        </p>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent border border-border mb-8">
          <Clock className="w-4 h-4 text-primary" />
          <span className="text-foreground text-sm font-semibold">Pending Review</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate("/home")}
            className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>
          <button
            onClick={() => navigate("/watch")}
            className="w-full py-3 rounded-full border border-border text-foreground font-semibold flex items-center justify-center gap-2 hover:bg-muted transition-colors"
          >
            Browse Content
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ApplicationPending;
