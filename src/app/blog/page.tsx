"use client";

import Link from "next/link";
import { ArrowRight, Leaf, Calendar, Clock, ChevronRight } from "lucide-react";

export default function BlogPage() {
  const posts = [
    {
      title: "The Future of Offline Ads is Digital",
      excerpt: "How connecting physical products to digital experiences is changing the marketing landscape forever.",
      date: "Jan 15, 2026",
      readTime: "4 min read",
      category: "Industry Trends",
      slug: "#",
    },
    {
      title: "Why QR Codes are Making a Comback",
      excerpt: "Driven by contactless needs and better native camera support, QR codes are more powerful than ever.",
      date: "Jan 08, 2026",
      readTime: "3 min read",
      category: "Technology",
      slug: "#",
    },
    {
      title: "Maximizing ROI with Physical Ad Space",
      excerpt: "Turning everyday objects into high-converting advertising channels with measurable analytics.",
      date: "Dec 22, 2025",
      readTime: "5 min read",
      category: "Marketing Strategy",
      slug: "#",
    },
  ];

  return (
    <main className="min-h-screen pt-24 pb-16 bg-slate-50">
      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight mb-4">
            Insights & Updates
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            The latest news on advertising technology, sustainability, and brand innovation from the AKUAFI team.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Featured Post - Green Initiative */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-2 h-8 bg-green-500 rounded-full"></span>
            Featured Story
          </h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
              <div className="order-2 md:order-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-semibold mb-6">
                  <Leaf size={16} />
                  <span>Green Initiative</span>
                </div>
                
                <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                  Sustainability at the Core of Connection: Our Commitment to a Greener Future
                </h3>
                
                <p className="text-slate-600 text-lg mb-8 leading-relaxed">
                  At AKUAFI, we believe technology should solve problems, not create waste. Discover how we're transforming the advertising industry by reducing physical clutter and planting seeds for a sustainable tomorrow.
                </p>
                
                <Link 
                  href="/blog/green-initiative"
                  className="inline-flex items-center gap-2 text-green-600 font-semibold text-lg hover:text-green-700 hover:gap-3 transition-all"
                >
                  Read the full story <ArrowRight size={20} />
                </Link>
              </div>
              
              <div className="order-1 md:order-2 bg-green-50 rounded-xl h-64 md:h-full min-h-[300px] flex items-center justify-center relative overflow-hidden group">
                 {/* Abstract decorative elements representing nature/tech */}
                 <div className="absolute inset-0 bg-gradient-to-br from-green-100/50 to-blue-50/50"></div>
                 <div className="relative z-10 text-center p-6">
                    <div className="w-24 h-24 mx-auto bg-white rounded-full shadow-lg flex items-center justify-center mb-4 text-green-500">
                      <Leaf size={48} />
                    </div>
                    <p className="text-slate-500 font-medium">Eco-Conscious Innovation</p>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Posts Grid */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-8">Latest Articles</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <article key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-blue-200 hover:shadow-soft-md transition-all group">
                <div className="h-48 bg-slate-100 relative">
                   {/* Placeholder for post image */}
                   <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400">
                      <span className="text-4xl font-light opacity-20">Image</span>
                   </div>
                   <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-slate-700 shadow-sm">
                        {post.category}
                      </span>
                   </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    <Link href={post.slug}>{post.title}</Link>
                  </h3>
                  
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  
                  <Link href={post.slug} className="inline-flex items-center text-blue-600 text-sm font-semibold hover:gap-2 transition-all">
                    Read More <ChevronRight size={16} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
