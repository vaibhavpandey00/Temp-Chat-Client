import { useEffect, useRef, useState } from 'react'
import { SendHorizontal } from 'lucide-react';
import socket from './clientSocket';
import { toast } from 'react-toastify';

function App() {
  const [ chats, setChats ] = useState([])
  const [ message, setMessage ] = useState('');
  const [ inputUsername, setInputUsername ] = useState('');
  const [ userCount, setUserCount ] = useState(0);
  const userNameRef = useRef(null);

  // useEffect(() => {
  //   // get username from local storage
  //   const username = localStorage.getItem('username');
  //   if (username) {
  //     userNameRef.current = username;
  //   }
  // }, [])

  useEffect(() => {
    socket.on("groupMessage", (data) => {
      setChats((prev) => [ ...prev, data ]);
    });

    socket.on('userCount', (count) => {
      setUserCount(count);
    });

    return () => {
      socket.off("groupMessage");
    };
  }, []);

  const checkUserName = async () => {
    try {
      let response;
      try {
        response = await fetch('http://localhost:8080/checkUsername', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: inputUsername.trim() })
        })
      } catch (error) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      if (data.exists === false) {
        handleSetUsername();
      }
      else {
        toast.error('Username already exists');
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [ chats ]);

  const handleSetUsername = () => {
    if (inputUsername.trim() !== '') {
      userNameRef.current = inputUsername.trim();
      socket.emit("register", { userId: inputUsername.trim() });
      // localStorage.setItem('username', userNameRef.current);
      toast.info(`Joined as ${userNameRef.current}`);
      setInputUsername(''); // clear input
    }
  };


  const handleMessageSend = () => {
    const messageData = {
      from: userNameRef.current,
      message,
    };
    socket.emit("groupMessage", messageData.message);
    setMessage("");
  };

  // Ask for username first
  if (!userNameRef.current) {
    return (
      <div className="w-full h-screen flex justify-center items-center">
        <div className="flex flex-col w-1/4 p-4 border rounded-md shadow-md">
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
            <h1 className="text-lg font-semibold">Group Chat</h1>
            <p className="text-sm">Users Online: {userCount}</p>
          </div>

          <div className="chats-window overflow-y-scroll p-2 h-full text-xl">
            {chats?.length > 0 && (
              <ul className="flex flex-col">
                {chats.map((chat, index) => (
                  <li key={index} className="mb-2 text-sm">
                    {chat.from === userNameRef.current ? (
                      <div className="flex flex-col items-end">
                        <h1 className="text-sm font-semibold text-blue-600">You</h1>
                        <p className="text-sm rounded-md p-2 bg-blue-200">{chat.message}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-start">
                        <h1 className="text-sm font-semibold text-blue-600">{chat.from}</h1>
                        <p className="text-sm rounded-md p-2 bg-purple-200">{chat.message}</p>
                      </div>
                    )}
                  </li>
                ))}
                {/* This will stay at the bottom and get scrolled into view */}
                <div ref={chatEndRef} />
              </ul>
            )}
          </div>


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
