import { useEffect, useRef, useState } from 'react'
import { SendHorizontal, LogOut } from 'lucide-react';
import socket from './clientSocket';
import { toast } from 'react-toastify';
import { getUrl } from './_getUrl';

const _BKuRl = getUrl();

function App() {
  const [ chats, setChats ] = useState([]);
  const [ message, setMessage ] = useState('');
  const [ inputUsername, setInputUsername ] = useState('');
  const [ userCount, setUserCount ] = useState(0);
  const [ userList, setUserList ] = useState([]);
  const [ loading, setLoading ] = useState(true);
  const [ renderAvailableUsers, setRenderAvailableUsers ] = useState(false);
  const userNameRef = useRef(null);

  // Check for existing session when component mounts
  useEffect(() => {
    const savedUsername = localStorage.getItem('username');

    if (savedUsername) {
      checkStoredUsername(savedUsername);
    } else {
      setLoading(false);
    }

    // Socket event listeners
    socket.on("groupMessage", (data) => {
      // console.log("Group Message: ", data);

      setChats((prev) => [ ...prev, data ]);
    });

    socket.on("privateMessage", (data) => {
      // console.log("Private Message: ", data);

      setChats((prev) => {
        // Check if this message ID already exists in the chat array
        const messageExists = prev.some(msg => msg.id === data.id);
        if (messageExists) {
          return prev;
        }
        return [ ...prev, data ];
      });
    });

    socket.on('userCount', (count) => {
      setUserCount(count);
    });

    socket.on('userList', (userList) => {
      // Filter out the current user and set the list directly
      const filteredList = userList.filter(user => user !== userNameRef.current);
      setUserList(filteredList);
    })

    return () => {
      socket.off("groupMessage");
      socket.off("userCount");
      socket.off("userList");
    };
  }, []);

  // useEffect to handle global keypress events
  useEffect(() => {
    // Function to handle keydown events
    const handleGlobalKeyPress = (e) => {
      // Only handle alphanumeric keys and common punctuation
      const isAlphaNumeric = /^[a-zA-Z0-9.,!? ]$/.test(e.key);

      // Ignore keypresses if they're in an input or textarea already
      const activeElement = document.activeElement;
      const isInputActive = activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA';

      // If it's an alphanumeric key and not already in a text field
      if (isAlphaNumeric && !isInputActive && userNameRef.current) {
        const chatInput = document.querySelector('input[placeholder="Type your message..."]');
        if (chatInput) {
          chatInput.focus();
        }
      }
    };

    // Add the event listener
    document.addEventListener('keydown', handleGlobalKeyPress);

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyPress);
    };
  }, []);

  useEffect(() => {
    if (message.includes('@')) {
      const userNameIsTagged = message.split('@')[ 1 ].split(' ')[ 0 ];
      if (!userNameIsTagged) {
        setRenderAvailableUsers(true);
      }
      else {
        setRenderAvailableUsers(false);
      }
    }
    else {
      setRenderAvailableUsers(false);
    }
  }, [ message ])

  // Function to check if stored username is still available
  const checkStoredUsername = async (username) => {
    try {
      const response = await fetch(`${_BKuRl}/checkUsername`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username })
      });

      const data = await response.json();

      if (data.exists === false) {
        userNameRef.current = username;
        socket.emit("register", { userId: username });
        toast.info(`Welcome back, ${username}!`);
      } else {
        localStorage.removeItem('username');
        toast.warn('Your previous session expired. Please enter a new username.');
      }
    } catch (error) {
      toast.error('Error connecting to server. Please try again.');
      localStorage.removeItem('username');
    } finally {
      setLoading(false);
    }
  };

  // Manual username check for new users
  const checkUserName = async () => {
    if (!isValidName()) return;
    if (!inputUsername.trim()) {
      toast.error('Please enter a username');
      return;
    }

    try {
      setLoading(true); // Start loading state
      const response = await fetch(`${_BKuRl}/checkUsername`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: inputUsername.trim() })
      });

      const data = await response.json();

      if (data.exists === false) {
        handleSetUsername();
      } else {
        toast.error('Username already exists');
      }
    } catch (error) {
      toast.error('Error connecting to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetUsername = () => {
    const username = inputUsername.trim();
    userNameRef.current = username;
    socket.emit("register", { userId: username });

    // Save username to localStorage for persistence
    localStorage.setItem('username', username);

    toast.info(`Joined as ${username}`);
    setInputUsername(''); // clear input
  };

  // Handle user logout
  const handleLogout = () => {
    localStorage.removeItem('username');
    userNameRef.current = null;
    // socket.emit("disconnect");
    setChats([]);
    setUserList([]);
    window.location.reload();
  };

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ chats ]);

  const isValidName = () => {
    if (inputUsername.length < 3) {
      toast.error('Username must be at least 3 characters long');
      return false;
    }
    if (inputUsername.length > 10) {
      toast.error('Username must be at most 10 characters long');
      return false;
    }
    if (!inputUsername.match(/^[a-zA-Z0-9]*$/)) {
      toast.error('Username can only contain letters and numbers');
      return false;
    }
    return true;
  }

  const handleMessageSend = () => {
    if (message.trim() === '') return;
    if (message.length > 2000) {
      toast.error('The message is too long');
      return;
    }

    if (message.includes('@')) {
      const userNameIsTagged = message.split('@')[ 1 ].split(' ')[ 0 ];
      if (userNameIsTagged) {
        if (!userList.includes(userNameIsTagged)) {
          toast.error('User not found');
          return;
        }
        handleTaggedUser(userNameIsTagged);
        return;
      }
    }

    socket.emit("groupMessage", message);
    setMessage("");
  };

  const handleTaggedUser = (username) => {
    let mewMessage = message.split('@')[ 1 ];
    socket.emit("privateMessage", {
      toUserId: username,
      message: mewMessage
    });
    setMessage("");
  };

  const taggUserButton = (username) => {
    const chatInput = document.querySelector('input[placeholder="Type your message..."]');
    if (chatInput) {
      chatInput.value = `@${username} `;
      chatInput.focus();
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Ask for username first
  if (!userNameRef.current) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="flex flex-col w-5/6 sm:w-1/2 md:w-1/2 lg:w-1/4 p-4 border rounded-md shadow-md">
          <h2 className="text-lg font-semibold mb-2">Enter your username</h2>
          <input
            type="text"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            className="border p-2 rounded mb-3"
            placeholder="Your name"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && checkUserName()}
          />
          <button
            onClick={checkUserName}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 cursor-pointer"
          >
            Join Chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-screen flex justify-center items-center">
        <div className="w-full sm:w-full md:w-1/2 xl:w-1/3 h-full flex flex-col justify-end overflow-hidden">
          <div className="header flex justify-between items-center p-2 border rounded-md">
            <h1 className="text-lg font-semibold">PPLzZ</h1>
            <div className="flex flex-col items-center">
              <p className="text-xs text-gray-400">@Username</p>
              <p className="text-sm font-semibold">{userNameRef.current}</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm">Online: {userCount}</p>
              <button
                onClick={handleLogout}
                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ml-2 lg:cursor-pointer"
                title="Logout"
              >
                <LogOut />
              </button>
            </div>
          </div>

          <div className="chats-window overflow-y-scroll p-2 h-full text-xl">
            {chats?.length > 0 && (
              <ul className="flex flex-col">
                {chats.map((chat, index) => (
                  <li key={index} className="mb-2 text-sm">
                    {chat.from === userNameRef.current ? (
                      <div className="flex flex-col items-end">
                        <h1 className="text-sm font-semibold text-blue-600">You</h1>
                        <p className={`text-sm rounded-md p-2 ${chat.isPrivate ? 'bg-amber-200' : 'bg-teal-200'}`}>{chat.message}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start">
                        <h1 className="text-sm font-semibold text-blue-600">{chat.from}</h1>
                        <p className={`text-sm rounded-md p-2 ${chat.isPrivate ? 'bg-amber-200' : 'bg-indigo-200'}`}>{chat.message}</p>
                      </div>
                    )}
                  </li>
                ))}
                {/* This will stay at the bottom and get scrolled into view */}
                <div ref={chatEndRef} />
              </ul>
            )}
          </div>

          {renderAvailableUsers && (
            <ul className="user-list flex flex-col max-h-[5rem] overflow-y-scroll z-[99] mb-1 p-2 rounded-2xl bg-gray-200"
            >
              {userList.map((user, index) => (
                <li key={index} className="mb-2 text-sm">
                  <button
                    onClick={() => taggUserButton(user)}
                    className="cursor-pointer w-full"
                  >
                    {user}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex justify-center items-center gap-4 p-2 border rounded-md">
            <input
              type="text"
              value={message}
              autoFocus
              onChange={(e) => setMessage(e.target.value)}
              className="w-full outline-none border border-gray-500 p-1 rounded-xl pl-3"
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === 'Enter' && handleMessageSend()}
            />
            <button className="cursor-pointer" onClick={handleMessageSend}><SendHorizontal /></button>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
