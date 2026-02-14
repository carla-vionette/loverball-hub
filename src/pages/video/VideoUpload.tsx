import { Upload, Video, FileText, Image } from "lucide-react";
import { motion } from "framer-motion";

const VideoUpload = () => {
  return (
    <div className="min-h-screen pb-20 md:pb-6">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 py-3 md:px-8 md:py-4 border-b border-border/20">
        <div className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          <h1 className="text-lg font-bold tracking-tight">Upload</h1>
        </div>
      </header>

      <div className="px-4 md:px-8 py-8 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Drop zone */}
          <div className="border-2 border-dashed border-border/50 rounded-xl p-10 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground mb-1">
              Drag & drop your video here
            </p>
            <p className="text-xs text-muted-foreground mb-4">MP4, MOV, or WebM • Max 500MB</p>
            <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
              Choose File
            </button>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                Title *
              </label>
              <input
                type="text"
                placeholder="Give your video a title..."
                className="w-full bg-secondary rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                Description
              </label>
              <textarea
                rows={4}
                placeholder="Tell viewers about your video..."
                className="w-full bg-secondary rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                  Category
                </label>
                <select className="w-full bg-secondary rounded-lg px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select category</option>
                  <option value="highlights">Highlights</option>
                  <option value="analysis">Analysis</option>
                  <option value="tutorials">Tutorials</option>
                  <option value="vlogs">Vlogs</option>
                  <option value="bts">Behind the Scenes</option>
                  <option value="docs">Documentaries</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                  Thumbnail
                </label>
                <div className="bg-secondary rounded-lg px-4 py-3 text-sm text-muted-foreground flex items-center gap-2 cursor-pointer hover:bg-secondary/80 transition-colors">
                  <Image className="w-4 h-4" />
                  <span>Upload thumbnail</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block mb-2">
                Tags
              </label>
              <input
                type="text"
                placeholder="basketball, highlights, NBA..."
                className="w-full bg-secondary rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">
              Publish
            </button>
            <button className="px-6 py-3 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
              Save Draft
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoUpload;
