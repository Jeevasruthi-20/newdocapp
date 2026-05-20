import React, { useMemo, useState } from "react";
import "./HealthyBlog.css";

const articles = [
  {
    id: 1,
    title: "Daily hydration habits for better immunity",
    category: "Nutrition",
    excerpt: "Boost your energy, support digestion, and strengthen immunity with these hydration routines.",
    author: "Dr. Maya Patel",
    date: "May 22, 2026",
    readTime: "4 min",
    featured: true,
  },
  {
    id: 2,
    title: "Mindfulness breaks to reduce stress at work",
    category: "Mental Health",
    excerpt: "Simple breathing and pause techniques for a calm mind during busy workdays.",
    author: "Dr. Aaron Lee",
    date: "May 18, 2026",
    readTime: "5 min",
  },
  {
    id: 3,
    title: "The best low-impact workouts for joint health",
    category: "Fitness",
    excerpt: "Keep your joints strong and pain-free with these doctor-approved routines.",
    author: "Dr. Nina Gomez",
    date: "May 12, 2026",
    readTime: "6 min",
  },
  {
    id: 4,
    title: "Smart eating habits to manage blood pressure",
    category: "Lifestyle",
    excerpt: "A balanced meal plan designed to support heart health and vitality.",
    author: "Dr. Lucas Grant",
    date: "May 08, 2026",
    readTime: "5 min",
  },
  {
    id: 5,
    title: "Preventive screening guidelines for adults",
    category: "Disease Prevention",
    excerpt: "Know the key checkups and what to expect at each stage of life.",
    author: "Dr. Priya Singh",
    date: "May 01, 2026",
    readTime: "7 min",
  },
];

const categories = ["All", "Nutrition", "Mental Health", "Fitness", "Lifestyle", "Disease Prevention"];

const HealthyBlog = () => {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesCategory = selectedCategory === "All" || article.category === selectedCategory;
      const matchesSearch = article.title.toLowerCase().includes(search.toLowerCase()) || article.excerpt.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, search]);

  return (
    <div className="healthy-blog-page">
      <div className="container">
        <section className="blog-hero card">
          <div className="hero-copy">
            <span className="eyebrow">Healthy Blog & Tips</span>
            <h1>Wellness advice from trusted clinicians.</h1>
            <p>Explore expert-backed health articles, curated for your lifestyle and wellbeing.</p>
            <div className="hero-actions">
              <button className="btn primary-btn">Start Reading</button>
              <button className="btn secondary-btn">Browse Topics</button>
            </div>
          </div>
          <div className="hero-metrics">
            <div className="metric-card">
              <span>230+</span>
              <p>Trusted Articles</p>
            </div>
            <div className="metric-card">
              <span>24/7</span>
              <p>Wellness Support</p>
            </div>
            <div className="metric-card">
              <span>5</span>
              <p>Health Categories</p>
            </div>
          </div>
        </section>

        <div className="blog-topbar">
          <div className="search-box blog-search">
            <input
              type="search"
              placeholder="Search articles, tips, and doctors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="category-pillset">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-pill ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <div className="blog-grid">
          {filteredArticles.map((article) => (
            <article key={article.id} className={`blog-card ${article.featured ? 'featured' : ''}`}>
              <div className="blog-card-top">
                <span className="category-badge">{article.category}</span>
                <button className="action-button">❤</button>
              </div>
              <h2>{article.title}</h2>
              <p>{article.excerpt}</p>
              <div className="blog-card-footer">
                <div className="author-chip">
                  <span>{article.author}</span>
                </div>
                <div className="meta-info">
                  <span>{article.date}</span>
                  <span>•</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="empty-state-card card">
            <h3>No articles matched your search.</h3>
            <p>Try a different keyword or select another category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthyBlog;
