import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ContentItem {
  id: number;
  title: string;
  image: string;
  description: string;
}

interface ContentCarouselProps {
  title: string;
  items: ContentItem[];
}

const ContentCarousel = ({ title, items }: ContentCarouselProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById(`carousel-${title}`);
    if (container) {
      const scrollAmount = direction === "left" ? -400 : 400;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setScrollPosition(container.scrollLeft + scrollAmount);
    }
  };

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-foreground mb-4 px-4">{title}</h2>
      
      <div className="relative group">
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-card opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <div
          id={`carousel-${title}`}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="flex-shrink-0 w-72 snap-start group/item cursor-pointer"
            >
              <div className="relative overflow-hidden rounded-lg aspect-video mb-2 bg-secondary">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
                />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-card/80 hover:bg-card opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => scroll("right")}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default ContentCarousel;
