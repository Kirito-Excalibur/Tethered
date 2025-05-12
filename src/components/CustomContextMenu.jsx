import React, { useState, useEffect } from 'react';

const CustomContextMenu = () => {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPosition({ x: e.pageX, y: e.pageY });
    setMenuVisible(true);
  };

  const handleClick = () => {
    setMenuVisible(false);
  };

  useEffect(() => {
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div onContextMenu={handleContextMenu} style={{ width: '100%', height: '100vh', background: '#eee' }}>
      <h1>Right-click anywhere in this area</h1>

      {menuVisible && (
        <ul
          style={{
            position: 'absolute',
            top: menuPosition.y,
            left: menuPosition.x,
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            listStyle: 'none',
            padding: '8px 0',
            margin: 0,
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            zIndex: 1000
          }}
        >
          <li style={{ padding: '6px 12px', cursor: 'pointer' }}>Option 1</li>
          <li style={{ padding: '6px 12px', cursor: 'pointer' }}>Option 2</li>
          <li style={{ padding: '6px 12px', cursor: 'pointer' }}>Option 3</li>
        </ul>
      )}
    </div>
  );
};

export default CustomContextMenu;
