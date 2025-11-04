import { useState } from "react";
import { Upload as UploadIcon, X } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import DesktopNav from "@/components/DesktopNav";
import MobileHeader from "@/components/MobileHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Upload = () => {
  const [caption, setCaption] = useState("");
  const { toast } = useToast();

  const handleUpload = () => {
    toast({
      title: "Upload feature coming soon!",
      description: "Video upload functionality will be available soon.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <DesktopNav />
      <BottomNav />
      
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0">
        <div className="container max-w-2xl mx-auto pt-20 md:pt-6 p-6">
          <h1 className="text-3xl font-bold mb-6">Upload Video</h1>
          
          <div className="space-y-6">
            <div className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer">
              <UploadIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-semibold mb-2">Click to upload video</p>
              <p className="text-sm text-muted-foreground">MP4, MOV, or WebM (max 100MB)</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Caption</label>
              <Textarea
                placeholder="Write a caption... (add #hashtags)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <Button onClick={handleUpload} className="w-full" size="lg">
              Post Video
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Upload;
