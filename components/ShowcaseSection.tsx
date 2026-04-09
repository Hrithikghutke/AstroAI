import React, { useState } from "react";
import { Grid, FileText, Layout, Briefcase, User, Smartphone, LayoutGrid, X, Monitor, Tablet, Smartphone as MobileIcon } from "lucide-react";

type ShowcaseItem = {
  id: number;
  title: string;
  category: string;
  categoryId: string;
  image: string;
  description: string;
  iframeUrl?: string;
};

const SHOWCASE_TABS = [
  { id: "all", label: "All", icon: LayoutGrid },
  { id: "landing", label: "Landing Pages", icon: FileText },
  { id: "apps", label: "Advanced Apps", icon: Layout },
  { id: "business", label: "Business Tools", icon: Briefcase },
  { id: "personal", label: "Personal Tools", icon: User },
  { id: "mobile", label: "Mobile Apps", icon: Smartphone },
];

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 1,
    title: "CrawlCube Landing",
    category: "Landing Pages",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    categoryId: "landing",
    description: "A dark-themed, stunning official homepage showcasing AI generation powers.",
    iframeUrl: "showcase_html/CrawlCube.html"
  },
  {
    id: 2,
    title: "MCE Dashboard",
    category: "Advanced Apps",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    categoryId: "apps",
    description: "A highly complex, data-centric web app layout tailored for management.",
    iframeUrl: "showcase_html/mce.html"
  },
   {
    id: 3,
    title: "ARVC Capitals",
    category: "Business Tools",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    categoryId: "business",
    description: "A highly complex, data-centric web app layout tailored for management.",
    iframeUrl: "showcase_html/ARVC.html"
  },
 
 
];

export default function ShowcaseSection() {
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPreview, setSelectedPreview] = useState<ShowcaseItem | null>(null);

  const filteredItems = activeTab === "all" 
    ? SHOWCASE_ITEMS 
    : SHOWCASE_ITEMS.filter(item => item.categoryId === activeTab);

  return (
    <>
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 relative z-10">
        
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
            <h2 className="text-2xl font-bold text-white tracking-tight">Showcase</h2>
          </div>
          <p className="text-neutral-400 text-sm">
            Explore what the community is building with CrawlCube.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-10 overflow-x-auto scrollbar-none pb-2">
          {SHOWCASE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${
                  isActive
                    ? "bg-white text-black border-white"
                    : "bg-transparent text-neutral-400 border-neutral-800 hover:border-neutral-600 hover:text-neutral-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filteredItems.map((item) => (
            <div key={item.id} className="group cursor-pointer">
              {/* Image Card */}
              <div 
                className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 mb-4 ring-1 ring-inset ring-white/5 transition-all duration-300 group-hover:border-neutral-600 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                onClick={() => setSelectedPreview(item)}
              >
                <div className="absolute inset-0 bg-neutral-800 animate-pulse" /> {/* Loading state */}
                
                {item.iframeUrl ? (
                  <div className="absolute inset-0 z-0 bg-white pointer-events-none select-none overflow-hidden transition-transform duration-700 group-hover:scale-105">
                    <div className="absolute top-0 left-0 w-[400%] h-[400%] origin-top-left scale-[0.25]">
                      <iframe
                        src={item.iframeUrl}
                        className="w-full h-full border-0"
                        scrolling="no"
                        tabIndex={-1}
                      />
                    </div>
                  </div>
                ) : (
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                    loading="lazy"
                  />
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />
                
                {/* Hover Preview Button */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100 z-20 pointer-events-none">
                  <span className="bg-white/10 backdrop-blur-md text-white border border-white/20 font-medium px-6 py-2.5 rounded-full text-sm shadow-xl flex items-center gap-2">
                    <Monitor className="w-4 h-4" />
                    Preview
                  </span>
                </div>
              </div>
              
              {/* Meta */}
              <div>
                <h3 className="text-white font-semibold text-base mb-1 group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-neutral-500 text-sm">
                  {item.category}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Full-Screen Preview Modal */}
      {selectedPreview && (
        <div className="fixed inset-0 z-[100] bg-black flex h-screen overflow-hidden animate-in fade-in duration-200">
          
          {/* Left Sidebar */}
          <div className="w-[320px] shrink-0 bg-[#0f0f0f] border-r border-white/5 flex flex-col h-full relative z-20">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <h2 className="text-white font-bold text-lg truncate pr-4">{selectedPreview.title}</h2>
              <button 
                onClick={() => setSelectedPreview(null)}
                className="text-neutral-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Description */}
            <div className="p-5 flex-1 overflow-y-auto">
              <p className="text-sm leading-relaxed text-neutral-400">
                {selectedPreview.description}
              </p>
            </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col relative h-full bg-[#050505] overflow-hidden">
            {/* Navbar */}
            <div className="h-14 border-b border-white/5 flex items-center justify-center px-4 bg-[#0a0a0a] relative z-10">
              <div className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-lg p-1">
                <button className="p-1.5 rounded-md bg-white/10 text-white">
                  <Monitor className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 transition-colors">
                  <Tablet className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 transition-colors">
                  <MobileIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Preview Frame */}
            <div className={`flex-1 w-full h-full pb-0 sm:pb-8 md:pb-12 px-0 pt-0 sm:px-8 md:px-12 sm:pt-8 md:pt-12 overflow-y-auto flex items-start justify-center ${selectedPreview.iframeUrl ? "p-0 sm:p-0 md:p-0 overflow-hidden" : ""}`}>
              <div className={`w-full max-w-[1200px] bg-black rounded-lg sm:rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 h-full ${selectedPreview.iframeUrl ? "max-w-none rounded-none border-0" : "min-h-full sm:min-h-0"}`}>
                {selectedPreview.iframeUrl ? (
                  <iframe src={selectedPreview.iframeUrl} className="w-full h-full border-0 bg-white" title={selectedPreview.title} />
                ) : (
                  <img 
                    src={selectedPreview.image} 
                    alt={selectedPreview.title} 
                    className="w-full h-auto block"
                  />
                )}
              </div>
            </div>
          </div>

        </div>
      )}
    </>
  );
}
