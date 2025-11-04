import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

const FloatingUploadButton = () => {
  return (
    <Link
      to="/upload"
      className="fixed bottom-24 right-4 md:hidden z-40 bg-primary text-primary-foreground rounded-full p-4 shadow-lg hover:bg-primary/90 transition-transform active:scale-95"
    >
      <Plus className="w-6 h-6" />
    </Link>
  );
};

export default FloatingUploadButton;
