import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../api/axios';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [input, setInput] = useState(searchParams.get('q') || '');

  const q = searchParams.get('q') || '';

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    API.get(`/posts/search?q=${encodeURIComponent(q)}`)
      .then(res => setResults(res.data.data || []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [q]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input.trim() });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Search Posts</h1>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-10">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Search by title, content, or description..."
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          autoFocus
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-indigo-700 transition"
        >
          Search
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20 text-gray-400">Searching...</div>
      )}

      {/* No results */}
      {!loading && searched && results.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500 font-medium">No results for "{q}"</p>
          <p className="text-sm text-gray-400 mt-1">Try different keywords</p>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div>
          <p className="text-sm text-gray-400 mb-4">{results.length} result{results.length !== 1 ? 's' : ''} for "{q}"</p>
          <div className="space-y-4">
            {results.map(post => (
              <Link
                key={post._id}
                to={`/post/${post.slug}`}
                className="flex gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
              >
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-24 h-20 object-cover rounded-lg shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {post.category && (
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {post.category.name}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{post.readingTime} min read</span>
                  </div>
                  <h2 className="text-base font-bold text-gray-800 truncate">{post.title}</h2>
                  {post.shortDescription && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.shortDescription}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                      {post.author?.fullName?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-xs text-gray-400">{post.author?.fullName}</span>
                    {post.tags?.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {post.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag._id}
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: tag.color || '#8b5cf6' }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state before first search */}
      {!searched && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🔎</p>
          <p>Type something above to search posts</p>
        </div>
      )}
    </div>
  );
}