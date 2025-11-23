import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function AdminDashboard({ handleLogout }) {
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState('');
  const [newPostPhoto, setNewPostPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(false);
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState({ username: '', admin_role: '' });
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyText, setReplyText] = useState({});
  const [replyPhoto, setReplyPhoto] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
  const fileInputRef = useRef(null);
  const replyFileInputRef = useRef({});

  useEffect(() => {
    fetchUserInfo();
    fetchPosts();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const userRes = await fetch('http://localhost:3001/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (userRes.ok) {
        const user = await userRes.json();
        setUserInfo({ username: user.username, admin_role: user.admin_role });
      }
    } catch (err) {
      console.error('Error fetching user info:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin-posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (newPost.trim().length === 0) return;

    setPostLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('content', newPost);
      if (newPostPhoto) {
        formData.append('photo', newPostPhoto);
      }

      const response = await fetch('http://localhost:3001/api/admin-posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setNewPost('');
        setNewPostPhoto(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchPosts();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create post');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setPostLoading(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin-posts/${postId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPosts();
      } else {
        setError('Failed to delete post');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReplySubmit = async (postId) => {
    const content = replyText[postId];
    if (!content || content.trim().length === 0) return;

    setReplyLoading({ ...replyLoading, [postId]: true });
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('content', content);
      if (replyPhoto[postId]) {
        formData.append('photo', replyPhoto[postId]);
      }

      const response = await fetch(`http://localhost:3001/api/admin-posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setReplyText({ ...replyText, [postId]: '' });
        setReplyPhoto({ ...replyPhoto, [postId]: null });
        if (replyFileInputRef.current[postId]) {
          replyFileInputRef.current[postId].value = '';
        }
        fetchPosts();
      } else {
        setError('Failed to create reply');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setReplyLoading({ ...replyLoading, [postId]: false });
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!window.confirm('Delete this reply?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin-posts/replies/${replyId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchPosts();
      } else {
        setError('Failed to delete reply');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-bg">
      <div style={{ display: 'flex', gap: 30, maxWidth: 900, margin: '0 auto', padding: 20 }}>
        <div style={{ flex: 1 }}>
          <div className="dashboard-container" style={{ color: 'black', marginBottom: 20 }}>
            <div className="dashboard-header">
              <div>
                <h1 style={{ color: 'black' }}>Admin Dashboard</h1>
                <div style={{ fontSize: 18, marginTop: 4, color: 'black' }}>
                  <strong>{userInfo.username}</strong> <span style={{ fontWeight: 400 }}>(Role: {userInfo.admin_role || 'Admin'})</span>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout}>Logout</button>
            </div>
            {error && <div className="error-message" style={{ marginBottom: 16 }}>{error}</div>}
          </div>

          {/* News Feed Section */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: 'black', marginTop: 0 }}>Admin News Feed</h2>

            {/* Post Creation Form */}
            <form onSubmit={handlePostSubmit} style={{ marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #e0e0e0' }}>
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Share an announcement or update with other admins..."
                rows="3"
                style={{
                  width: '100%',
                  padding: 12,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  fontFamily: 'inherit',
                  fontSize: 14,
                  color: 'black',
                  marginBottom: 12,
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
              {newPostPhoto && (
                <div style={{ marginBottom: 12, fontSize: 12, color: '#666' }}>
                  📎 {newPostPhoto.name}
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewPostPhoto(e.target.files[0])}
                  style={{ flex: 1, fontSize: 12 }}
                />
                <button
                  type="submit"
                  disabled={newPost.trim().length === 0 || postLoading}
                  style={{
                    background: newPost.trim().length === 0 ? '#ccc' : '#4a90e2',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: 6,
                    cursor: newPost.trim().length === 0 ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {postLoading ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>

            {/* Posts List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {posts.length === 0 ? (
                <p style={{ color: '#999', fontStyle: 'italic', margin: 0 }}>No posts yet. Be the first to share an update!</p>
              ) : (
                posts.map(post => (
                  <div key={post.id} style={{
                    background: '#f8f9fa',
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid #e0e0e0',
                    color: 'black'
                  }}>
                    {/* Post Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                      <div>
                        <strong style={{ fontSize: 15 }}>{post.username}</strong>
                        <p style={{ margin: 0, fontSize: 12, color: '#666', marginTop: 2 }}>
                          {new Date(post.created_at).toLocaleString()}
                        </p>
                      </div>
                      {post.user_id === JSON.parse(atob(localStorage.getItem('token')?.split('.')[1] || '{}'))?.id && (
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#e74c3c',
                            cursor: 'pointer',
                            fontSize: 14,
                            textDecoration: 'underline'
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Post Content */}
                    <p style={{ margin: '0 0 12px 0', lineHeight: 1.5, wordWrap: 'break-word' }}>
                      {post.content}
                    </p>

                    {/* Post Photo */}
                    {post.photo && (
                      <img
                        src={`http://localhost:3001/uploads/${post.photo}`}
                        alt="Post"
                        style={{
                          maxWidth: '100%',
                          maxHeight: 300,
                          borderRadius: 6,
                          marginBottom: 12,
                          objectFit: 'cover'
                        }}
                      />
                    )}

                    {/* Replies Toggle */}
                    <button
                      onClick={() => setExpandedReplies({
                        ...expandedReplies,
                        [post.id]: !expandedReplies[post.id]
                      })}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4a90e2',
                        cursor: 'pointer',
                        fontSize: 14,
                        textDecoration: 'underline',
                        marginBottom: 12
                      }}
                    >
                      {expandedReplies[post.id] ? '▼' : '▶'} Replies ({post.replies?.length || 0})
                    </button>

                    {/* Replies Section */}
                    {expandedReplies[post.id] && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #ddd' }}>
                        {/* Reply Input */}
                        <div style={{ marginBottom: 16 }}>
                          <textarea
                            value={replyText[post.id] || ''}
                            onChange={(e) => setReplyText({ ...replyText, [post.id]: e.target.value })}
                            placeholder="Write a reply..."
                            rows="2"
                            style={{
                              width: '100%',
                              padding: 10,
                              border: '1px solid #ddd',
                              borderRadius: 6,
                              fontFamily: 'inherit',
                              fontSize: 13,
                              color: 'black',
                              marginBottom: 8,
                              boxSizing: 'border-box'
                            }}
                          />
                          {replyPhoto[post.id] && (
                            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                              📎 {replyPhoto[post.id].name}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input
                              ref={(el) => { replyFileInputRef.current[post.id] = el; }}
                              type="file"
                              accept="image/*"
                              onChange={(e) => setReplyPhoto({ ...replyPhoto, [post.id]: e.target.files[0] })}
                              style={{ flex: 1, fontSize: 12 }}
                            />
                            <button
                              onClick={() => handleReplySubmit(post.id)}
                              disabled={(replyText[post.id] || '').trim().length === 0 || replyLoading[post.id]}
                              style={{
                                background: (replyText[post.id] || '').trim().length === 0 ? '#ccc' : '#4a90e2',
                                color: 'white',
                                border: 'none',
                                padding: '8px 16px',
                                borderRadius: 6,
                                cursor: (replyText[post.id] || '').trim().length === 0 ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                fontSize: 13,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {replyLoading[post.id] ? 'Replying...' : 'Reply'}
                            </button>
                          </div>
                        </div>

                        {/* Replies List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {post.replies && post.replies.length > 0 ? (
                            post.replies.map(reply => (
                              <div key={reply.id} style={{
                                background: '#fff',
                                padding: 12,
                                borderRadius: 6,
                                border: '1px solid #f0f0f0',
                                marginLeft: 16
                              }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                                  <div>
                                    <strong style={{ fontSize: 13 }}>{reply.username}</strong>
                                    <p style={{ margin: 0, fontSize: 11, color: '#999', marginTop: 1 }}>
                                      {new Date(reply.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                  {reply.user_id === JSON.parse(atob(localStorage.getItem('token')?.split('.')[1] || '{}'))?.id && (
                                    <button
                                      onClick={() => handleDeleteReply(reply.id)}
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        color: '#e74c3c',
                                        cursor: 'pointer',
                                        fontSize: 12,
                                        textDecoration: 'underline'
                                      }}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.4, wordWrap: 'break-word' }}>
                                  {reply.content}
                                </p>
                                {reply.photo && (
                                  <img
                                    src={`http://localhost:3001/uploads/${reply.photo}`}
                                    alt="Reply"
                                    style={{
                                      maxWidth: '100%',
                                      maxHeight: 200,
                                      borderRadius: 4,
                                      marginTop: 8,
                                      objectFit: 'cover'
                                    }}
                                  />
                                )}
                              </div>
                            ))
                          ) : (
                            <p style={{ fontSize: 12, color: '#999', fontStyle: 'italic', margin: 0 }}>No replies yet</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard; 