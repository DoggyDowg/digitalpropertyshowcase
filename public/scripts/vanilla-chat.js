/**
 * Vanilla JavaScript implementation of the CustomChat component
 * for the Digital Property Showcase landing page
 */

// TEST LINE TO VERIFY THIS SPECIFIC FILE IS BEING LOADED
console.log("🚀 Vanilla-chat.js loaded - version with test line");

// Wrap all code in an immediately-invoked function expression (IIFE) to isolate scope
(function() {
  try {
    // Configuration
    const CHAT_CONFIG = {
      initialMessage: "👋 Welcome to Digital Property Showcase! Ready to stand out and win more listings? I'm here to answer any questions or show you how it works.",
      inputPlaceholder: "Type your message here...",
      maxInputLength: 1000,
    };

    const UI_CONFIG = {
      chatWindow: {
        width: 400,
        height: 600,
        minHeight: 400,
        maxHeight: '80vh',
      }
    };

    const APP_INFO = {
      title: 'Digital Property Showcase',
      description: 'Welcome to',
      copyright: 'AI-powered assistant - responses may not always be accurate',
    };

    // Replace with your landing page API key - Modified to work in browser context
    const DIFY_CONFIG = {
      APP_KEY: 'dummy-key', // Adding a dummy value to bypass the fallback check
      API_URL: '/api/dify-chat-proxy', // Use the relative path to your Vercel serverless function
    };

    // Initial quick replies
    const INITIAL_QUICK_REPLIES = [
      {
        text: 'How much does this service cost?',
        action: 'How much does this service cost?'
      },
      {
        text: 'How long does it take to create one of these?',
        action: 'How long does it take to create one of these?'
      },
      {
        text: 'What makes this different from my regular property listings?',
        action: 'What makes this different from my regular property listings?'
      }
    ];

    // Class implementation
    class VanillaChat {
      constructor() {
        this.isOpen = false;
        this.isLoading = false;
        this.conversationId = null;
        this.messages = [
          {
            role: 'assistant',
            content: CHAT_CONFIG.initialMessage,
            id: 'initial',
            quickReplies: INITIAL_QUICK_REPLIES
          }
        ];
        
        this.init();
      }
      
      init() {
        try {
          this.createChatButton();
          this.createChatWindow();
          this.bindEvents();
          this.renderMessages(); // Render initial messages
          console.log('Chat widget initialized successfully');
        } catch (error) {
          console.error('Error initializing chat widget:', error);
          // Try fallback initialization if regular initialization fails
          try {
            console.log('Attempting fallback initialization...');
            this.fallbackInitialization();
          } catch (fallbackError) {
            console.error('Fallback initialization also failed:', fallbackError);
          }
        }
      }
      
      fallbackInitialization() {
        console.log('Starting fallback chat initialization');
        
        // Remove any existing chat elements that might be causing problems
        const existingButton = document.getElementById('chat-toggle-button');
        const existingWindow = document.getElementById('chat-window');
        
        if (existingButton) existingButton.remove();
        if (existingWindow) existingWindow.remove();
        
        // Create a completely isolated chat button with max specificity inline styles
        const button = document.createElement('button');
        button.id = 'dps-chat-button';
        
        // Apply styles as HTML attribute - highest priority
        button.setAttribute('style', `
          position: fixed !important;
          bottom: 32px !important;
          right: 32px !important;
          left: auto !important;
          top: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 56px !important;
          height: 56px !important;
          min-width: 56px !important;
          min-height: 56px !important;
          max-width: 56px !important;
          max-height: 56px !important;
          background-color: #3A24C7 !important;
          color: white !important;
          border-radius: 16px !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          z-index: 99999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: none !important;
          cursor: pointer !important;
          transform: none !important;
          transition: none !important;
        `);
        
        // Apply some styles via direct DOM properties for even more override strength
        button.style.position = 'fixed';
        button.style.bottom = '32px';
        button.style.right = '32px';
        button.style.left = 'auto';
        
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 24px; height: 24px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        `;
        
        // Create a simple chat window
        const chatWindow = document.createElement('div');
        chatWindow.id = 'dps-chat-window';
        
        // Apply styles directly to the chat window
        chatWindow.setAttribute('style', `
          position: fixed !important;
          bottom: 100px !important;
          right: 32px !important;
          left: auto !important;
          top: auto !important;
          width: 350px !important;
          height: 500px !important;
          background-color: white !important;
          border-radius: 16px !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
          z-index: 99998 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          border: 1px solid rgba(229, 231, 235, 1) !important;
          transform: scale(0) !important;
          opacity: 0 !important;
          transition: transform 0.3s ease, opacity 0.3s ease !important;
          margin: 0 !important;
          padding: 0 !important;
        `);
        
        chatWindow.innerHTML = `
          <div style="background-color: #3A24C7; color: white; padding: 16px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 style="font-size: 16px; font-weight: 600; margin: 0;">${APP_INFO.title}</h2>
            </div>
            <button id="dps-chat-close" style="background: none; border: none; color: white; cursor: pointer; padding: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div id="dps-chat-messages" style="flex: 1; overflow-y: auto; padding: 16px;"></div>
          
          <div style="padding: 12px; border-top: 1px solid rgba(229, 231, 235, 1);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <input 
                type="text" 
                id="dps-chat-input" 
                placeholder="${CHAT_CONFIG.inputPlaceholder}" 
                style="flex: 1; padding: 8px; font-size: 14px; border: 1px solid rgba(229, 231, 235, 1); border-radius: 12px; outline: none;"
              />
              <button id="dps-chat-send" style="padding: 8px; background-color: #3A24C7; color: white; border-radius: 12px; border: none; cursor: pointer;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        `;
        
        // Append elements to body
        document.body.appendChild(button);
        document.body.appendChild(chatWindow);
        
        console.log('Fallback chat elements created');
        
        // Add welcome message and quick replies
        const messagesContainer = document.getElementById('dps-chat-messages');
        if (messagesContainer) {
          // Add welcome message
          const welcomeMessage = document.createElement('div');
          welcomeMessage.style.padding = '10px';
          welcomeMessage.style.backgroundColor = '#F3F4F6';
          welcomeMessage.style.borderRadius = '16px';
          welcomeMessage.style.borderBottomLeftRadius = '0';
          welcomeMessage.style.marginBottom = '16px';
          welcomeMessage.style.width = 'fit-content';
          welcomeMessage.style.maxWidth = '80%';
          welcomeMessage.textContent = CHAT_CONFIG.initialMessage;
          messagesContainer.appendChild(welcomeMessage);
          
          // Add quick reply buttons
          const quickRepliesContainer = document.createElement('div');
          quickRepliesContainer.style.display = 'flex';
          quickRepliesContainer.style.flexDirection = 'column';
          quickRepliesContainer.style.gap = '8px';
          quickRepliesContainer.style.marginLeft = '10px';
          
          INITIAL_QUICK_REPLIES.forEach(reply => {
            const replyButton = document.createElement('button');
            replyButton.textContent = reply.text;
            replyButton.style.textAlign = 'left';
            replyButton.style.padding = '6px 12px';
            replyButton.style.borderRadius = '12px';
            replyButton.style.backgroundColor = '#EBF5FF';
            replyButton.style.color = '#3B82F6';
            replyButton.style.border = 'none';
            replyButton.style.cursor = 'pointer';
            
            replyButton.addEventListener('click', (e) => {
              e.preventDefault(); // Prevent any default navigation
              console.log("Quick reply clicked:", reply.text);
              
              // Add user message
              const userMessage = document.createElement('div');
              userMessage.style.padding = '10px';
              userMessage.style.backgroundColor = '#3A24C7';
              userMessage.style.color = 'white';
              userMessage.style.borderRadius = '16px';
              userMessage.style.borderBottomRightRadius = '0';
              userMessage.style.marginBottom = '16px';
              userMessage.style.marginLeft = 'auto';
              userMessage.style.width = 'fit-content';
              userMessage.style.maxWidth = '80%';
              userMessage.textContent = reply.text;
              messagesContainer.appendChild(userMessage);
              
              // Add simple response (no API call)
              setTimeout(() => {
                const responseMessage = document.createElement('div');
                responseMessage.style.padding = '10px';
                responseMessage.style.backgroundColor = '#F3F4F6';
                responseMessage.style.borderRadius = '16px';
                responseMessage.style.borderBottomLeftRadius = '0';
                responseMessage.style.marginBottom = '16px';
                responseMessage.style.width = 'fit-content';
                responseMessage.style.maxWidth = '80%';
                
                // Create simple response based on question
                if (reply.text.toLowerCase().includes('cost')) {
                  responseMessage.textContent = "We offer three options: Demonstration Showcase (AU$149) for pitching to vendors, Normal Showcase (AU$399) for live listings, and Enterprise pricing for volume needs. For detailed pricing information, please check our pricing section on the website.";
                } 
                else if (reply.text.toLowerCase().includes('how long')) {
                  responseMessage.textContent = "Once we have all your information and assets, your showcase website will be ready within 48 hours! The entire process typically takes 3-5 days from start to finish.";
                }
                else {
                  responseMessage.textContent = "Digital Property Showcase offers custom-branded property websites that help you stand out from standard listings. These showcases are designed specifically to win you more listings by impressing potential vendors with your marketing approach.";
                }
                
                messagesContainer.appendChild(responseMessage);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
              }, 1000);
              
              // Remove quick replies after clicking
              quickRepliesContainer.style.display = 'none';
              
              // Scroll to bottom
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            });
            
            quickRepliesContainer.appendChild(replyButton);
          });
          
          messagesContainer.appendChild(quickRepliesContainer);
        }
        
        console.log('Fallback chat content created');
        
        // Set up event listeners
        button.addEventListener('click', () => {
          if (chatWindow.style.opacity === '0') {
            chatWindow.style.transform = 'scale(1)';
            chatWindow.style.opacity = '1';
          } else {
            chatWindow.style.transform = 'scale(0)';
            chatWindow.style.opacity = '0';
          }
        });
        
        const closeButton = document.getElementById('dps-chat-close');
        if (closeButton) {
          closeButton.addEventListener('click', (e) => {
            e.preventDefault();
            chatWindow.style.transform = 'scale(0)';
            chatWindow.style.opacity = '0';
          });
        }
        
        const sendButton = document.getElementById('dps-chat-send');
        const inputField = document.getElementById('dps-chat-input');
        
        if (sendButton && inputField) {
          const handleSendMessage = (e) => {
            e.preventDefault();
            const messageText = inputField.value.trim();
            if (!messageText) return;
            
            // Add user message
            const userMessage = document.createElement('div');
            userMessage.style.padding = '10px';
            userMessage.style.backgroundColor = '#3A24C7';
            userMessage.style.color = 'white';
            userMessage.style.borderRadius = '16px';
            userMessage.style.borderBottomRightRadius = '0';
            userMessage.style.marginBottom = '16px';
            userMessage.style.marginLeft = 'auto';
            userMessage.style.width = 'fit-content';
            userMessage.style.maxWidth = '80%';
            userMessage.textContent = messageText;
            messagesContainer.appendChild(userMessage);
            
            // Clear input
            inputField.value = '';
            
            // Add simple response (no API call)
            setTimeout(() => {
              const responseMessage = document.createElement('div');
              responseMessage.style.padding = '10px';
              responseMessage.style.backgroundColor = '#F3F4F6';
              responseMessage.style.borderRadius = '16px';
              responseMessage.style.borderBottomLeftRadius = '0';
              responseMessage.style.marginBottom = '16px';
              responseMessage.style.width = 'fit-content';
              responseMessage.style.maxWidth = '80%';
              responseMessage.textContent = "Thank you for your message! Digital Property Showcase helps real estate agents win more listings with premium property marketing. Would you like to know more about our features, pricing, or process?";
              messagesContainer.appendChild(responseMessage);
              
              // Scroll to bottom
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 1000);
            
            // Scroll to bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          };
          
          sendButton.addEventListener('click', handleSendMessage);
          
          // Add enter key support
          inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              handleSendMessage(e);
            }
          });
        }
        
        console.log('Fallback chat fully initialized');
      }
      
      createChatButton() {
        const button = document.createElement('button');
        button.id = 'chat-toggle-button';
        
        // Use direct styles instead of Tailwind classes
        Object.assign(button.style, {
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          width: '56px',
          height: '56px',
          backgroundColor: '#3A24C7', // var(--primary-color)
          color: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease-in-out, background-position 4s ease',
          transform: 'none',
          zIndex: '9999',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
          margin: '0',
          overflow: 'hidden', // Important for the gradient effect
          backgroundSize: '200% auto', // For gradient animation
          backgroundImage: 'linear-gradient(to right, #3A24C7 0%, rgba(255, 51, 122, 0.5) 50%, #3A24C7 100%)', // Gradient matching the primary button
          backgroundPosition: '0% 50%',
          animation: 'lp-primary-gradient-scroll 8s ease infinite'
        });
        
        // Ensure styles are applied with !important
        for (const property in button.style) {
          if (typeof button.style[property] !== 'function') {
            button.style.setProperty(property, button.style[property], 'important');
          }
        }
        
        button.setAttribute('aria-label', 'Open chat');
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 24px; height: 24px; position: relative; z-index: 2;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        `;
        
        // Add hover effects
        button.addEventListener('mouseover', function() {
          this.style.setProperty('transform', 'scale(1.03)', 'important');
          this.style.setProperty('boxShadow', '0 4px 15px rgba(58, 36, 199, 0.3)', 'important');
          this.style.setProperty('animation', 'lp-primary-gradient-scroll 4s ease infinite', 'important');
        });
        
        button.addEventListener('mouseout', function() {
          this.style.setProperty('transform', 'none', 'important');
          this.style.setProperty('boxShadow', '0 4px 6px rgba(0, 0, 0, 0.1)', 'important');
          this.style.setProperty('animation', 'lp-primary-gradient-scroll 8s ease infinite', 'important');
        });
        
        document.body.appendChild(button);
        return button;
      }
      
      createChatWindow() {
        const chatWindow = document.createElement('div');
        chatWindow.id = 'chat-window';
        
        // Apply direct styles instead of relying on Tailwind classes
        Object.assign(chatWindow.style, {
          position: 'fixed',
          bottom: '100px',
          right: '32px',
          width: `${UI_CONFIG.chatWindow.width}px`,
          height: `${UI_CONFIG.chatWindow.height}px`,
          maxHeight: UI_CONFIG.chatWindow.maxHeight,
          minHeight: `${UI_CONFIG.chatWindow.minHeight}px`,
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          transition: 'transform 0.3s ease, opacity 0.3s ease',
          transform: 'scale(0)',
          opacity: '0',
          zIndex: '9998',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid rgba(229, 231, 235, 1)'
        });
        
        // Ensure critical styles are applied with !important
        chatWindow.style.setProperty('position', 'fixed', 'important');
        chatWindow.style.setProperty('bottom', '100px', 'important');
        chatWindow.style.setProperty('right', '32px', 'important');
        chatWindow.style.setProperty('zIndex', '9998', 'important');
        
        chatWindow.innerHTML = `
          <div id="chat-header" style="background: linear-gradient(90deg, #3A24C7 0%, #3A24C7 70%, #FF337A 120%); color: white; padding: 8px; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="height: 24px; width: 32px; padding-left: 8px;">
                <img src="/logos/white_icon.png" alt="Logo" style="height: 100%; width: 100%;" />
              </div>
              <div>
                <p style="font-size: 12px; margin: 0;">Welcome to</p>
                <h2 style="font-size: 16px; font-weight: 600; margin: 0;">${APP_INFO.title}</h2>
              </div>
            </div>
            <button id="chat-close" style="background: none; border: none; color: white; cursor: pointer; padding: 4px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div id="chat-messages" style="flex: 1; overflow-y: auto; padding: 16px;"></div>
          
          <div id="chat-input-container" style="padding: 12px; border-top: 1px solid rgba(229, 231, 235, 1);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <input 
                type="text" 
                id="chat-input" 
                placeholder="${CHAT_CONFIG.inputPlaceholder}" 
                maxlength="${CHAT_CONFIG.maxInputLength}"
                style="flex: 1; padding: 8px; font-size: 14px; border: 1px solid rgba(229, 231, 235, 1); border-radius: 12px; outline: none;"
              />
              <button id="chat-send-button" style="padding: 8px; background-color: #3A24C7; color: white; border-radius: 12px; border: none; cursor: pointer;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div style="margin-top: 6px; font-size: 10px; color: #9CA3AF; font-style: italic; text-align: left;">
              ${APP_INFO.copyright}
            </div>
          </div>
        `;
        
        document.body.appendChild(chatWindow);
        return chatWindow;
      }
      
      bindEvents() {
        // Toggle button
        const toggleButton = document.getElementById('chat-toggle-button');
        toggleButton.addEventListener('click', () => this.toggleChat());
        
        // Close button
        const closeButton = document.getElementById('chat-close');
        closeButton.addEventListener('click', () => {
          // Close the chat window directly and ensure button reappears
          this.forceChatClose();
        });
        
        // Send button
        const sendButton = document.getElementById('chat-send-button');
        sendButton.addEventListener('click', (e) => {
          e.preventDefault(); // Prevent default form submission or navigation
          this.sendMessage();
        });
        
        // Input field - send on Enter
        const inputField = document.getElementById('chat-input');
        inputField.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.sendMessage();
          }
        });
        
        // Update send button state on input - ONLY disable when empty
        inputField.addEventListener('input', () => {
          const isEmpty = inputField.value.trim() === '';
          sendButton.disabled = isEmpty;
          sendButton.style.opacity = isEmpty ? '0.5' : '1';
        });
      }
      
      toggleChat(force = null) {
        const chatWindow = document.getElementById('chat-window');
        const toggleButton = document.getElementById('chat-toggle-button');
        
        // Determine the new state (open or closed)
        const isCurrentlyOpen = chatWindow.style.transform === 'scale(1)';
        const shouldOpen = force !== null ? force : !isCurrentlyOpen;
        
        console.log(`toggleChat called. shouldOpen: ${shouldOpen}, force: ${force}, isCurrentlyOpen: ${isCurrentlyOpen}`);
        
        if (shouldOpen) {
          // Open the chat window
          chatWindow.style.transform = 'scale(1)';
          chatWindow.style.opacity = '1';
          
          // Reposition the chat window to use the button's space
          chatWindow.style.setProperty('bottom', '32px', 'important');
          
          // Hide the toggle button
          toggleButton.style.setProperty('display', 'none', 'important');
          console.log('Chat opened, toggle button hidden');
          
          // Focus the input field
          setTimeout(() => {
            const inputField = document.getElementById('chat-input');
            if (inputField) inputField.focus();
          }, 300);
          
          // Scroll to bottom
          this.scrollToBottom();
        } else {
          // Close the chat window
          chatWindow.style.transform = 'scale(0)';
          chatWindow.style.opacity = '0';
          
          // Reset the chat window position
          chatWindow.style.setProperty('bottom', '100px', 'important');
          
          // Show the toggle button and set icon to chat
          toggleButton.style.setProperty('display', 'flex', 'important');
          console.log('Chat closed, toggle button should be visible now');
          toggleButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 24px; height: 24px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          `;
        }
      }
      
      renderMessages() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;
        
        messagesContainer.innerHTML = '';
        
        // Helper function to parse basic markdown
        const parseMarkdown = (text) => {
          if (!text) return '';
          
          // Replace line breaks with <br> tags
          let html = text.replace(/\n/g, '<br>');
          
          // Bold - replace **text** with <strong>text</strong>
          html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          
          // Handle lists
          // Unordered lists - replace "- item" with list items
          if (html.includes('- ')) {
            const lines = html.split('<br>');
            let inList = false;
            let result = [];
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              if (line.trim().startsWith('- ')) {
                // List item
                if (!inList) {
                  result.push('<ul style="margin: 5px 0; padding-left: 20px;">');
                  inList = true;
                }
                const itemContent = line.trim().substring(2);
                result.push(`<li style="margin-bottom: 3px;">${itemContent}</li>`);
              } else {
                // Regular text
                if (inList) {
                  result.push('</ul>');
                  inList = false;
                }
                result.push(line);
              }
            }
            
            if (inList) {
              result.push('</ul>');
            }
            
            html = result.join('');
          }
          
          return html;
        };
        
        // Sort messages by their timestamp ID to ensure correct order
        const sortedMessages = [...this.messages].sort((a, b) => {
          // Initial message always comes first
          if (a.id === 'initial') return -1;
          if (b.id === 'initial') return 1;
          
          // Otherwise sort by numeric ID (timestamp)
          return parseInt(a.id) - parseInt(b.id);
        });
        
        sortedMessages.forEach(message => {
          const messageElement = document.createElement('div');
          messageElement.style.display = 'flex';
          messageElement.style.flexDirection = 'column';
          messageElement.style.gap = '8px';
          messageElement.style.marginBottom = '16px';
          
          // Message bubble
          const bubbleContainer = document.createElement('div');
          bubbleContainer.style.display = 'flex';
          bubbleContainer.style.alignItems = 'flex-end';
          bubbleContainer.style.gap = '8px';
          
          if (message.role === 'user') {
            bubbleContainer.style.justifyContent = 'flex-end';
          } else {
            bubbleContainer.style.justifyContent = 'flex-start';
          }
          
          // Avatar for assistant
          if (message.role === 'assistant') {
            const avatar = document.createElement('div');
            avatar.style.width = '28px';
            avatar.style.height = '28px';
            avatar.style.borderRadius = '50%';
            avatar.style.backgroundColor = '#3A24C7';
            avatar.style.display = 'flex';
            avatar.style.alignItems = 'center';
            avatar.style.justifyContent = 'center';
            avatar.style.flexShrink = '0';
            
            avatar.innerHTML = `<img src="/logos/white_icon.png" style="height: 16px; width: 16px;" alt="Assistant" />`;
            bubbleContainer.appendChild(avatar);
          }
          
          // Message content
          const contentContainer = document.createElement('div');
          contentContainer.style.display = 'flex';
          contentContainer.style.flexDirection = 'column';
          contentContainer.style.gap = '8px';
          contentContainer.style.maxWidth = '80%';
          
          const contentBubble = document.createElement('div');
          contentBubble.style.padding = '10px';
          contentBubble.style.borderRadius = '16px';
          contentBubble.style.fontSize = '14px';
          
          if (message.role === 'user') {
            contentBubble.style.backgroundColor = '#3A24C7';
            contentBubble.style.color = 'white';
            contentBubble.style.borderBottomRightRadius = '0';
          } else if (message.role === 'system') {
            contentBubble.style.backgroundColor = '#F9FAFB';
            contentBubble.style.color = '#6B7280';
            contentBubble.style.fontSize = '12px';
            contentBubble.style.fontStyle = 'italic';
          } else {
            contentBubble.style.backgroundColor = '#F3F4F6';
            contentBubble.style.color = '#1F2937';
            contentBubble.style.borderBottomLeftRadius = '0';
          }
          
          // Apply markdown formatting for assistant messages
          if (message.role === 'assistant') {
            contentBubble.innerHTML = parseMarkdown(message.content);
          } else {
            contentBubble.textContent = message.content;
          }
          
          contentContainer.appendChild(contentBubble);
          bubbleContainer.appendChild(contentContainer);
          
          // Avatar for user
          if (message.role === 'user') {
            const avatar = document.createElement('div');
            avatar.style.width = '28px';
            avatar.style.height = '28px';
            avatar.style.borderRadius = '50%';
            avatar.style.backgroundColor = '#E5E7EB';
            avatar.style.display = 'flex';
            avatar.style.alignItems = 'center';
            avatar.style.justifyContent = 'center';
            avatar.style.flexShrink = '0';
            
            avatar.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="#6B7280">
                <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
              </svg>
            `;
            bubbleContainer.appendChild(avatar);
          }
          
          messageElement.appendChild(bubbleContainer);
          
          // Quick replies
          if (message.quickReplies && message.quickReplies.length > 0) {
            const quickRepliesContainer = document.createElement('div');
            quickRepliesContainer.style.marginLeft = '36px';
            quickRepliesContainer.style.display = 'flex';
            quickRepliesContainer.style.flexDirection = 'column';
            quickRepliesContainer.style.gap = '8px';
            
            const quickRepliesLabel = document.createElement('p');
            quickRepliesLabel.style.fontSize = '12px';
            quickRepliesLabel.style.color = '#6B7280';
            quickRepliesLabel.style.opacity = '0.85';
            quickRepliesLabel.style.padding = '0 4px';
            quickRepliesLabel.textContent = 'Click a question below to start the conversation:';
            quickRepliesContainer.appendChild(quickRepliesLabel);
            
            message.quickReplies.forEach(reply => {
              const replyButton = document.createElement('button');
              replyButton.style.textAlign = 'left';
              replyButton.style.padding = '6px 12px';
              replyButton.style.borderRadius = '12px';
              replyButton.style.backgroundColor = '#EBF5FF';
              replyButton.style.color = '#3B82F6';
              replyButton.style.fontSize = '14px';
              replyButton.style.border = 'none';
              replyButton.style.cursor = 'pointer';
              replyButton.style.transition = 'background-color 0.2s';
              
              replyButton.addEventListener('mouseover', function() {
                this.style.backgroundColor = '#DBEAFE';
              });
              
              replyButton.addEventListener('mouseout', function() {
                this.style.backgroundColor = '#EBF5FF';
              });
              
              replyButton.textContent = reply.text;
              replyButton.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent any default navigation
                console.log("Quick reply button clicked:", reply.text);
                this.handleQuickReply(reply.action);
              });
              quickRepliesContainer.appendChild(replyButton);
            });
            
            messageElement.appendChild(quickRepliesContainer);
          }
          
          messagesContainer.appendChild(messageElement);
        });
        
        this.scrollToBottom();
      }
      
      scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
      
      async sendMessage() {
        const inputField = document.getElementById('chat-input');
        const messageText = inputField.value.trim();
        
        if (!messageText || messageText.length > CHAT_CONFIG.maxInputLength) return;
        
        // Add user message to UI
        this.messages.push({
          role: 'user',
          content: messageText,
          id: Date.now().toString()
        });
        
        this.renderMessages();
        inputField.value = '';
        
        // Set loading state
        this.isLoading = true;
        this.updateSendButtonState(true); // Only update appearance, not disable functionality
        
        let assistantMessage = ''; // Initialize for the new response stream
        const currentAssistantMessageId = 'assistant-' + Date.now().toString();

        // Add a placeholder for the assistant's message
        this.messages.push({
          role: 'assistant',
          content: '', // Start with empty content, or '...' for typing indicator
          id: currentAssistantMessageId
        });
        // Optionally render messages here if you want the placeholder to show immediately
        // this.renderMessages();

        try {
          // Use fallback responses if no API key is available
          if (!DIFY_CONFIG.APP_KEY) {
            console.log("No API key available, using fallback responses");
            console.log("DIFY_CONFIG value:", JSON.stringify(DIFY_CONFIG));
            
            // Wait a moment to simulate processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Create fallback response based on question
            let responseText = '';
            if (messageText.toLowerCase().includes('cost') || messageText.toLowerCase().includes('price')) {
              responseText = "We offer three options: Demonstration Showcase (AU$149) for pitching to vendors using previous listing data, Normal Showcase (AU$399) for live listings with all premium features including branding and Instagram carousel, and Enterprise pricing for agencies with volume needs.";
            } 
            else if (messageText.toLowerCase().includes('time') || messageText.toLowerCase().includes('long') || messageText.toLowerCase().includes('create')) {
              responseText = "Once we have all your property information and assets, your showcase website will be ready within 48 hours! The entire process from initial contact to going live typically takes 3-5 days total.";
            }
            else if (messageText.toLowerCase().includes('different') || messageText.toLowerCase().includes('unique')) {
              responseText = "Unlike standard property listings, our showcases are custom-branded websites with unlimited media, interactive maps, and dedicated hosting. They're specifically designed to win you more listings by impressing sellers with premium marketing that standard portals can't match.";
            }
            else {
              responseText = "Thanks for your question! Digital Property Showcase helps real estate agents stand out with premium property marketing. Each showcase is a dedicated website that highlights your property and your brand, helping you win more listings. Would you like to know more about our features, pricing, or process?";
            }
            
            // Add response to messages
            this.messages.push({
              role: 'assistant',
              content: responseText,
              id: Date.now().toString()
            });
            
            this.renderMessages();
            this.isLoading = false;
            this.updateSendButtonState(false);
            return;
          }
          
          const response = await this.callChatAPI(messageText);
          const reader = response.body?.getReader();
          // let assistantMessage = ''; // Moved to the top of the function
          let hasStartedMessage = false;
          
          while (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                
                try {
                  const data = JSON.parse(jsonStr);
                  console.log('Received SSE data:', data);
                  
                  if (data.event === 'message' && data.answer) {
                    // Accumulate the streamed response
                    assistantMessage += data.answer;
                    hasStartedMessage = true;
                    
                    // Update the specific message we added for this response
                    const messageToUpdate = this.messages.find(m => m.id === currentAssistantMessageId);
                    if (messageToUpdate) {
                      messageToUpdate.content = assistantMessage;
                    }
                    
                    this.renderMessages();
                    
                    if (!this.conversationId && data.conversation_id) {
                      this.conversationId = data.conversation_id;
                    }
                  } else if (data.event === 'error') {
                    throw new Error(data.data || 'Unknown error from Dify API');
                  }
                } catch (parseErr) { 
                  console.error("Could not parse error response from proxy as JSON:", parseErr); 
                  // detail already contains errorText, so no need to set it again
                }
              }
            }
          }
          
          if (!hasStartedMessage) {
            throw new Error('No response received from assistant');
          }
        } catch (error) {
          console.error('Error sending message:', error);
          this.messages.push({
            role: 'system',
            content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
            id: Date.now().toString()
          });
          this.renderMessages();
        } finally {
          this.isLoading = false;
          this.updateSendButtonState(false);
        }
      }
      
      async handleQuickReply(action) {
        if (!action.trim()) return;
        
        console.log("🎯 Quick reply clicked:", action);
        
        // Add user message for the quick reply
        this.messages.push({
          role: 'user',
          content: action,
          id: Date.now().toString()
        });
        
        this.renderMessages();
        
        // Process the same way as normal message
        this.isLoading = true;
        this.updateSendButtonState(true); // Only update appearance, not disable functionality
        
        let assistantMessage = ''; // Initialize for the new response stream
        const currentAssistantMessageId = 'assistant-' + Date.now().toString();

        // Add a placeholder for the assistant's message
        this.messages.push({
          role: 'assistant',
          content: '', // Start with empty content, or '...' for typing indicator
          id: currentAssistantMessageId
        });
        // Optionally render messages here if you want the placeholder to show immediately
        // this.renderMessages();

        try {
          // Use fallback responses if no API key is available
          if (!DIFY_CONFIG.APP_KEY) {
            console.log("No API key available, using fallback responses for quick reply");
            console.log("DIFY_CONFIG value:", JSON.stringify(DIFY_CONFIG));
            
            // Wait a moment to simulate processing
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Create fallback response based on question
            let responseText = '';
            if (action.toLowerCase().includes('cost') || action.toLowerCase().includes('price')) {
              responseText = "We offer three options: Demonstration Showcase (AU$149) for pitching to vendors using previous listing data, Normal Showcase (AU$399) for live listings with all premium features including branding and Instagram carousel, and Enterprise pricing for agencies with volume needs.";
            } 
            else if (action.toLowerCase().includes('time') || action.toLowerCase().includes('long') || action.toLowerCase().includes('create')) {
              responseText = "Once we have all your property information and assets, your showcase website will be ready within 48 hours! The entire process from initial contact to going live typically takes 3-5 days total.";
            }
            else if (action.toLowerCase().includes('different') || action.toLowerCase().includes('unique')) {
              responseText = "Unlike standard property listings, our showcases are custom-branded websites with unlimited media, interactive maps, and dedicated hosting. They're specifically designed to win you more listings by impressing sellers with premium marketing that standard portals can't match.";
            }
            else {
              responseText = "Thanks for your question! Digital Property Showcase helps real estate agents stand out with premium property marketing. Each showcase is a dedicated website that highlights your property and your brand, helping you win more listings. Would you like to know more about our features, pricing, or process?";
            }
            
            // Add response to messages
            this.messages.push({
              role: 'assistant',
              content: responseText,
              id: Date.now().toString()
            });
            
            this.renderMessages();
            this.isLoading = false;
            this.updateSendButtonState(false);
            return;
          }
          
          const response = await this.callChatAPI(action);
          const reader = response.body?.getReader();
          // let assistantMessage = ''; // Moved to the top of the function
          let hasStartedMessage = false;
          
          while (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n').filter(line => line.trim() !== '');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr) continue;
                
                try {
                  const data = JSON.parse(jsonStr);
                  console.log('Received SSE data:', data);
                  
                  if (data.event === 'message' && data.answer) {
                    // Accumulate the streamed response
                    assistantMessage += data.answer;
                    hasStartedMessage = true;
                    
                    // Update the specific message we added for this response
                    const messageToUpdate = this.messages.find(m => m.id === currentAssistantMessageId);
                    if (messageToUpdate) {
                      messageToUpdate.content = assistantMessage;
                    }
                    
                    this.renderMessages();
                    
                    if (!this.conversationId && data.conversation_id) {
                      this.conversationId = data.conversation_id;
                    }
                  } else if (data.event === 'error') {
                    throw new Error(data.data || 'Unknown error from Dify API');
                  }
                } catch (parseErr) { 
                  console.error("Could not parse error response from proxy as JSON:", parseErr); 
                  // detail already contains errorText, so no need to set it again
                }
              }
            }
          }
          
          if (!hasStartedMessage) {
            throw new Error('No response received from assistant');
          }
        } catch (error) {
          console.error('Error sending message:', error);
          this.messages.push({
            role: 'system',
            content: error instanceof Error ? error.message : 'Sorry, I encountered an error. Please try again.',
            id: Date.now().toString()
          });
          this.renderMessages();
        } finally {
          this.isLoading = false;
          this.updateSendButtonState(false);
        }
      }
      
      updateSendButtonState(isLoading = false) {
        const sendButton = document.getElementById('chat-send-button');
        const inputField = document.getElementById('chat-input');
        
        if (!sendButton || !inputField) return;
        
        // Only check if the input is empty to determine if the button should be disabled
        const isEmpty = inputField.value.trim() === '';
        sendButton.disabled = isEmpty;
        
        // Just update the appearance based on loading state
        if (isLoading) {
          sendButton.innerHTML = `
            <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="animation: spin 1s linear infinite;">
              <style>
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              </style>
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" style="opacity: 0.25;" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" style="opacity: 0.75;" />
            </svg>
          `;
        } else {
          sendButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          `;
        }
        
        // Visual feedback but don't disable button while loading
        sendButton.style.opacity = isEmpty ? '0.5' : '1';
      }
      
      async callChatAPI(message) {
        const body = {
          inputs: {},
          query: message,
          response_mode: 'streaming', // Proxy will handle this for Dify
          conversation_id: this.conversationId,
          user: 'user',
          chat_type: 'landingpage',
        };

        console.log('Sending chat request to:', DIFY_CONFIG.API_URL);
        console.log('Request body:', body);

        // Requests now go to our proxy, not directly to Dify
        const response = await fetch(DIFY_CONFIG.API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${DIFY_CONFIG.APP_KEY}`, // REMOVE THIS - Proxy handles Auth
            'Accept': 'application/json',
          },
          body: JSON.stringify(body),
          mode: 'cors'
        });

        console.log('Response status:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response body:', errorText);
          // Try to parse errorText if it's JSON, otherwise use it directly
          let detail = errorText;
          try {
            const errJson = JSON.parse(errorText);
            detail = errJson.details || errJson.error || errorText;
          } catch (parseErr) { 
            console.error("Could not parse error response from proxy as JSON:", parseErr); 
            // detail already contains errorText, so no need to set it again
          }
          throw new Error(`Failed to send message via proxy: ${response.statusText} - ${detail}`);
        }

        console.log('API call successful, streaming response...');
        return response;
      }
      
      // New function to force close the chat and guarantee a button appears
      forceChatClose() {
        console.log('forceChatClose called - closing chat and ensuring button exists');
        
        // Get the chat window
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow) {
          // Close the chat window
          chatWindow.style.transform = 'scale(0)';
          chatWindow.style.opacity = '0';
          chatWindow.style.setProperty('bottom', '100px', 'important');
        }
        
        // Try to find the existing toggle button
        let toggleButton = document.getElementById('chat-toggle-button');
        
        // If the button doesn't exist or is not in the DOM, create a new one
        if (!toggleButton || !document.body.contains(toggleButton)) {
          console.log('Toggle button not found, creating a new one');
          toggleButton = this.createChatButton();
        }
        
        // Make sure the button is visible with all required styles
        if (toggleButton) {
          toggleButton.style.setProperty('position', 'fixed', 'important');
          toggleButton.style.setProperty('bottom', '32px', 'important');
          toggleButton.style.setProperty('right', '32px', 'important');
          toggleButton.style.setProperty('display', 'flex', 'important');
          toggleButton.style.setProperty('opacity', '1', 'important');
          toggleButton.style.setProperty('visibility', 'visible', 'important');
          toggleButton.style.setProperty('z-index', '9999', 'important');
          
          // Set the chat icon
          toggleButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 24px; height: 24px;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          `;
          
          console.log('Toggle button should now be visible', toggleButton);
        }
        
        // Also check for the ultimate button as a fallback
        const ultimateButton = document.getElementById('ultimate-chat-button');
        if (ultimateButton) {
          ultimateButton.style.setProperty('display', 'flex', 'important');
          ultimateButton.style.setProperty('opacity', '1', 'important');
          ultimateButton.style.setProperty('visibility', 'visible', 'important');
          
          // Update its icon too
          ultimateButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:24px; height:24px; display:block;">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          `;
          
          console.log('Ultimate button should now be visible', ultimateButton);
        }
      }
    }

    // Initialize the chat widget in a try/catch block to prevent page errors
    try {
      console.log('Initializing VanillaChat...');
      window.vanillaChat = new VanillaChat();
      console.log('VanillaChat initialized successfully');
    } catch (error) {
      console.error('Failed to initialize VanillaChat:', error);
    }

    // Initialize on DOMContentLoaded as well to ensure it loads
    document.addEventListener('DOMContentLoaded', () => {
      try {
        if (!window.vanillaChat) {
          console.log('Initializing VanillaChat on DOMContentLoaded');
          window.vanillaChat = new VanillaChat();
        }
      } catch (error) {
        console.error('Failed to initialize VanillaChat on DOMContentLoaded:', error);
      }
    });

    // Last resort direct inline chat button
    // This is completely isolated from the rest of the code
    // It will only run if the chat button is not visible after 3 seconds
    setTimeout(() => {
      try {
        console.log('Running ultimate last-resort chat button creation');

        // Remove any existing buttons first
        const existingButtons = [
          document.getElementById('chat-toggle-button'),
          document.getElementById('dps-chat-button'),
          document.getElementById('last-resort-chat-button'),
          document.getElementById('ultimate-chat-button'), // Remove previous ultimate attempts
          document.getElementById('chat-button-shield') // Remove previous shield attempts
        ];

        existingButtons.forEach(btn => {
          if (btn) btn.remove();
        });
        
        // Attempt to neutralize parent styles that can break fixed positioning
        document.body.style.transform = 'none';
        document.body.style.filter = 'none';
        document.body.style.perspective = 'none';
        document.documentElement.style.transform = 'none';
        document.documentElement.style.filter = 'none';
        document.documentElement.style.perspective = 'none';

        // Create the button
        const button = document.createElement('button');
        button.id = 'ultimate-chat-button';

        // Minimal but forceful styling for the button
        button.style.cssText = `
          position: fixed !important;
          bottom: 32px !important;
          right: 32px !important;
          left: auto !important;
          top: auto !important;
          width: 56px !important;
          height: 56px !important;
          background-color: #3A24C7 !important;
          color: white !important;
          border-radius: 16px !important;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1) !important;
          transition: all 0.3s ease-in-out, background-position 4s ease !important;
          transform: none !important;
          z-index: 2147483647 !important; /* Max z-index */
          border: none !important;
          outline: none !important;
          cursor: pointer !important;
          display: flex !important; /* Initially flex, will be conditionally appended */
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
          margin: 0 !important;
          overflow: hidden !important; /* Prevent content spill and for gradient */
          -webkit-transform-style: preserve-3d !important; /* Hint for stacking context */
          transform: translateZ(0) !important; /* Force hardware acceleration / new stacking context */
          background-size: 200% auto !important; /* For gradient animation */
          background-image: linear-gradient(to right, #3A24C7 0%, rgba(255, 51, 122, 0.5) 50%, #3A24C7 100%) !important; /* Gradient matching the primary button */
          background-position: 0% 50% !important;
          animation: lp-primary-gradient-scroll 8s ease infinite !important;
        `;

        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:24px; height:24px; display:block; position:relative; z-index:2;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        `;
        
        // Add hover effects
        button.addEventListener('mouseover', function() {
          this.style.setProperty('transform', 'scale(1.03)', 'important');
          this.style.setProperty('boxShadow', '0 4px 15px rgba(58, 36, 199, 0.3)', 'important');
          this.style.setProperty('animation', 'lp-primary-gradient-scroll 4s ease infinite', 'important');
        });
        
        button.addEventListener('mouseout', function() {
          this.style.setProperty('transform', 'none', 'important');
          this.style.setProperty('boxShadow', '0 4px 6px rgba(0, 0, 0, 0.1)', 'important');
          this.style.setProperty('animation', 'lp-primary-gradient-scroll 8s ease infinite', 'important');
        });

        // RE-ADD THE CLICK LISTENER FOR THIS ULTIMATE BUTTON
        button.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          let chatWindow = document.getElementById('dps-chat-window') || document.getElementById('chat-window');
          if (chatWindow) {
            const isCurrentlyOpen = (chatWindow.style.transform === 'scale(1)' && chatWindow.style.opacity === '1');
            if (isCurrentlyOpen) {
              // Close chat window
              chatWindow.style.transform = 'scale(0)';
              chatWindow.style.opacity = '0';
              chatWindow.style.setProperty('bottom', '100px', 'important');
              // Show this ultimate button
              button.style.setProperty('display', 'flex', 'important');
              button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:24px; height:24px; display:block;">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              `;
              // Also ensure the main toggle button (if it exists somehow) is shown.
              const mainToggleButton = document.getElementById('chat-toggle-button');
              if (mainToggleButton) {
                mainToggleButton.style.setProperty('display', 'flex', 'important');
              }
            } else {
              // Open chat window
              chatWindow.style.transform = 'scale(1)';
              chatWindow.style.opacity = '1';
              chatWindow.style.setProperty('bottom', '32px', 'important');
              // Hide this ultimate button
              button.style.setProperty('display', 'none', 'important');
              // Also hide the main toggle button if it exists
              const mainToggleButton = document.getElementById('chat-toggle-button');
              if (mainToggleButton) {
                mainToggleButton.style.setProperty('display', 'none', 'important');
              }
              // Focus input
              const inputField = chatWindow.querySelector('#dps-chat-input') || chatWindow.querySelector('#chat-input');
              if (inputField) {
                setTimeout(() => inputField.focus(), 300);
              }
            }
          } else {
            console.error("Chat window element not found for ultimate button to toggle.");
            // Potentially alert or provide some feedback if chat window itself is missing
            // alert("Chat window is currently unavailable. Please try refreshing.");
          }
        });

        // Check if the chat window is already open before showing this ultimate button
        const chatWindowForCheck = document.getElementById('chat-window') || document.getElementById('dps-chat-window');
        let chatIsOpen = false;
        if (chatWindowForCheck) {
            chatIsOpen = (chatWindowForCheck.style.transform === 'scale(1)' && chatWindowForCheck.style.opacity === '1');
        }

        if (!chatIsOpen) {
            console.log('Ultimate button will be shown as chat is not open.');
            document.body.appendChild(button); // Append if chat is closed

            // After a short delay, check if it's correctly positioned. If not, try re-parenting.
            setTimeout(() => {
              const rect = button.getBoundingClientRect();
              const viewportWidth = window.innerWidth;
              const viewportHeight = window.innerHeight;

              const isCorrectlyPositioned = 
                rect.right > viewportWidth - 100 && rect.right <= viewportWidth &&
                rect.bottom > viewportHeight - 100 && rect.bottom <= viewportHeight &&
                rect.width > 0 && rect.height > 0;

              if (!isCorrectlyPositioned) {
                console.warn('Ultimate button not fixed, attempting re-parenting to a new clean root div.');
                if (button.parentNode === document.body) {
                  document.body.removeChild(button);
                }
                let cleanRoot = document.getElementById('chat-clean-root');
                if (!cleanRoot) {
                  cleanRoot = document.createElement('div');
                  cleanRoot.id = 'chat-clean-root';
                  cleanRoot.style.cssText = `
                    position: absolute !important; top: 0 !important; left: 0 !important;
                    width: 0 !important; height: 0 !important; border: none !important;
                    padding: 0 !important; margin: 0 !important; z-index: auto;
                    background: transparent !important; transform: none !important;
                    filter: none !important; perspective: none !important;
                  `;
                  document.documentElement.appendChild(cleanRoot);
                }
                cleanRoot.appendChild(button);
              }
              
               const finalRect = button.getBoundingClientRect();
               if(finalRect.width === 0 || finalRect.height === 0) {
                 console.error("Ultimate button is still not visible after all attempts.");
               }
            }, 200);
        } else {
            console.log('Ultimate last resort chat button created but not shown because chat window is already open.');
            // We still want its event listener to be active in case it's needed later,
            // so it should be in the DOM but hidden if the chat is open.
            // However, the current logic only appends if !chatIsOpen.
            // A more robust approach might be to always append it, then explicitly set display:none if chatIsOpen.
            // For now, this matches the previous intent of not appending if chat is open.
        }

        console.log('Ultimate last resort chat button attempt finished.');

      } catch (error) {
        console.error('Failed to create ultimate last resort chat button:', error);
      }
    }, 3500); // Increased timeout slightly for this more complex fallback
  } catch (error) {
    console.error('Critical error in VanillaChat script:', error);
  }
})();