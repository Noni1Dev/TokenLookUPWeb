    document.addEventListener('DOMContentLoaded', function () {
      // Basic elements
      const tokenInput = document.getElementById('tokenInput');
      const toggleVisibility = document.getElementById('toggleVisibility');
      const lookupBtn = document.getElementById('lookupBtn');
      const resultContainer = document.getElementById('resultContainer');
      const loadingSpinner = document.getElementById('loadingSpinner');
      const errorMessage = document.getElementById('errorMessage');
      const clearToken = document.getElementById('clearToken');
      const tokenHelp = document.getElementById('tokenHelp');
      const tokenHelpModal = document.getElementById('tokenHelpModal');
      const closeTokenHelp = document.getElementById('closeTokenHelp');
      const validateToken = document.getElementById('validateToken');
      const tokenValidation = document.getElementById('tokenValidation');
      const tokenType = document.getElementById('tokenType');
      const tokenStatus = document.getElementById('tokenStatus');

      // Tab elements
      const tabButtons = document.querySelectorAll('[data-tab]');
      const tabContents = document.querySelectorAll('.tab-content');

      // Current user data
      let userData = null;
      let currentToken = null;

      // Toggle password visibility
      let isTokenVisible = false;
      toggleVisibility.addEventListener('click', function () {
        isTokenVisible = !isTokenVisible;
        tokenInput.type = isTokenVisible ? 'text' : 'password';
        toggleVisibility.innerHTML = isTokenVisible ? 
          '<i class="fas fa-eye-slash"></i>' : 
          '<i class="fas fa-eye"></i>';
      });

      // Clear token input
      clearToken.addEventListener('click', function() {
        tokenInput.value = '';
        tokenInput.focus();
        tokenValidation.classList.add('hidden');
      });

      // Token help modal
      tokenHelp.addEventListener('click', function() {
        tokenHelpModal.classList.remove('hidden');
      });

      closeTokenHelp.addEventListener('click', function() {
        tokenHelpModal.classList.add('hidden');
      });

      // Close modal when clicking outside
      tokenHelpModal.addEventListener('click', function(e) {
        if (e.target === tokenHelpModal) {
          tokenHelpModal.classList.add('hidden');
        }
      });

      // Token validation
      validateToken.addEventListener('click', function() {
        const token = tokenInput.value.trim();
        
        if (!token) {
          tokenValidation.classList.add('hidden');
          return;
        }
        
        // Check token format
        const isBotToken = token.startsWith('Bot ') || token.match(/^[A-Za-z0-9]{24}\.[A-Za-z0-9]{6}\.[A-Za-z0-9_-]{38}$/);
        const isUserToken = token.match(/^[A-Za-z0-9]{24}\.[A-Za-z0-9]{6}\.[A-Za-z0-9_-]{27}$/);
        
        if (isBotToken) {
          tokenType.textContent = 'USER TOKEN';
          tokenType.className = 'px-2 py-1 rounded-full font-bold token-type-user';
          tokenStatus.textContent = 'Valid user token format detected';
          tokenStatus.className = 'ml-2 text-green-400';
        } else if (isUserToken) {
          tokenType.textContent = 'USER TOKEN';
          tokenType.className = 'px-2 py-1 rounded-full font-bold token-type-user';
          tokenStatus.textContent = 'Valid user token format detected';
          tokenStatus.className = 'ml-2 text-green-400';
        } else {
          tokenType.textContent = 'UNKNOWN';
          tokenType.className = 'px-2 py-1 rounded-full font-bold token-type-unknown';
          tokenStatus.textContent = 'Invalid token format';
          tokenStatus.className = 'ml-2 text-red-400';
        }
        
        tokenValidation.classList.remove('hidden');
      });

      // Tab switching
      tabButtons.forEach(tab => {
        tab.addEventListener('click', function() {
          const tabName = this.getAttribute('data-tab');
          
          // Update active tab
          tabButtons.forEach(t => {
            t.classList.remove('tab-active');
            t.classList.add('tab-inactive');
          });
          this.classList.add('tab-active');
          this.classList.remove('tab-inactive');
          
          // Show correct panel
          tabContents.forEach(panel => panel.classList.add('hidden'));
          document.getElementById(tabName + 'Tab').classList.remove('hidden');
          
          // Load additional data if needed
          if (tabName === 'friends' && currentToken) {
            loadFriends(currentToken);
          } else if (tabName === 'guilds' && currentToken) {
            loadGuilds(currentToken);
          } else if (tabName === 'billing' && currentToken) {
            loadBillingInfo(currentToken);
          } else if (tabName === 'connections' && currentToken) {
            loadConnections(currentToken);
          }
        });
      });

      // Copy button functionality
      document.addEventListener('click', function(e) {
        if (e.target.closest('[data-copy]')) {
          const button = e.target.closest('[data-copy]');
          const field = button.getAttribute('data-copy');
          const text = document.getElementById(field).textContent;
          
          navigator.clipboard.writeText(text).then(() => {
            const icon = button.querySelector('i');
            const originalIcon = icon.className;
            
            // Change icon to checkmark temporarily
            icon.className = 'fas fa-check text-green-500';
            
            setTimeout(() => {
              icon.className = originalIcon;
            }, 1500);
          });
        }
      });

      // Main lookup function
      lookupBtn.addEventListener('click', async function () {
        const token = tokenInput.value.trim();
        currentToken = token;
        
        if (!token) {
          errorMessage.textContent = 'Please enter a Discord token';
          errorMessage.classList.remove('hidden');
          return;
        }
        
        // Reset UI
        resultContainer.classList.add('hidden');
        errorMessage.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
        
        try {
          // Get user data
          const response = await fetch('https://tokenlookup.onrender.com/proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              endpoint: 'users/@me',
              method: 'GET',
              token: token
            })
          });
          
          loadingSpinner.classList.add('hidden');
          
          if (!response.ok) {
            errorMessage.textContent = 'Invalid token or error fetching data';
            errorMessage.classList.remove('hidden');
            return;
          }
          
          userData = await response.json();
          
          // Update UI with user data
          updateUserProfile(userData);
          
          // Reset to profile tab
          tabButtons.forEach(t => {
            t.classList.remove('tab-active');
            t.classList.add('tab-inactive');
          });
          tabButtons[0].classList.add('tab-active');
          tabButtons[0].classList.remove('tab-inactive');
          tabContents.forEach(panel => panel.classList.add('hidden'));
          document.getElementById('profileTab').classList.remove('hidden');
          
          resultContainer.classList.remove('hidden');
          
          // Load additional data
          loadConnectionStatus(token);
        } catch (err) {
          console.error(err);
          loadingSpinner.classList.add('hidden');
          errorMessage.textContent = 'Network error occurred';
          errorMessage.classList.remove('hidden');
        }
      });

      // Update user profile UI
      function updateUserProfile(data) {
        // Basic info
        document.getElementById('username').textContent = data.username || 'N/A';
        document.getElementById('userId').textContent = data.id || 'N/A';
        document.getElementById('email').textContent = data.email || 'Not available';
        document.getElementById('phone').textContent = data.phone || 'Not set';
        document.getElementById('mfa').textContent = data.mfa_enabled ? 'Enabled' : 'Disabled';
        
        // Avatar
        if (data.avatar) {
          const avatarUrl = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=256`;
          document.getElementById('avatar').src = avatarUrl;
        } else {
          const defaultAvatarNumber = data.discriminator ? parseInt(data.discriminator) % 5 : 0;
          document.getElementById('avatar').src = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        }
        
        // Badges
        const nitroBadge = document.getElementById('nitroBadge');
        if (data.premium_type > 0) {
          nitroBadge.textContent = data.premium_type === 2 ? 'NITRO' : 'CLASSIC';
          nitroBadge.classList.remove('hidden');
        } else {
          nitroBadge.classList.add('hidden');
        }
        
        // Token type badge
        //const tokenTypeBadge = document.getElementById('tokenTypeBadge');
        //if (currentToken.startsWith('Bot ') || currentToken.match(/^[A-Za-z0-9]{24}\.[A-Za-z0-9]{6}\.[A-Za-z0-9_-]{38}$/)) {
          //tokenTypeBadge.innerHTML = '<i class="fas fa-robot mr-1"></i> BOT';
          //tokenTypeBadge.className = 'px-3 py-1 rounded-full text-xs font-bold text-white bg-blue-600';
        //} else {
          //tokenTypeBadge.innerHTML = '<i class="fas fa-user mr-1"></i> USER';
          //tokenTypeBadge.className = 'px-3 py-1 rounded-full text-xs font-bold text-white bg-green-600';
        //}
        
        // Creation date
        const createdAt = new Date(Number((BigInt(data.id) >> 22n) + 1420070400000n));
        document.getElementById('creationDate').textContent = createdAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // Bio and additional info
        document.getElementById('bio').textContent = data.bio || 'No bio set';
        document.getElementById('locale').textContent = data.locale || 'en-US';
        document.getElementById('theme').textContent = data.theme || 'Dark';
        
        // Display colors if available
        if (data.banner_color) {
          document.getElementById('bannerColor').textContent = data.banner_color;
        } else {
          document.getElementById('bannerColor').textContent = 'None';
        }
        
        if (data.accent_color) {
          const hexColor = '#' + data.accent_color.toString(16).padStart(6, '0');
          document.getElementById('accentColor').textContent = hexColor;
        } else {
          document.getElementById('accentColor').textContent = 'None';
        }
        
        // Account flags
        const flagsContainer = document.getElementById('flagsContainer');
        flagsContainer.innerHTML = '';
        
        if (data.public_flags) {
          const flags = [];
          
          // Discord account flags
          if (data.public_flags & 1) flags.push({ name: 'STAFF', color: 'bg-red-600' });
          if (data.public_flags & 2) flags.push({ name: 'PARTNER', color: 'bg-purple-600' });
          if (data.public_flags & 4) flags.push({ name: 'HYPESQUAD', color: 'bg-yellow-600' });
          if (data.public_flags & 8) flags.push({ name: 'BUG_HUNTER', color: 'bg-green-600' });
          if (data.public_flags & 64) flags.push({ name: 'HYPESQUAD_BRAVERY', color: 'bg-blue-600' });
          if (data.public_flags & 128) flags.push({ name: 'HYPESQUAD_BRILLIANCE', color: 'bg-indigo-600' });
          if (data.public_flags & 256) flags.push({ name: 'HYPESQUAD_BALANCE', color: 'bg-pink-600' });
          if (data.public_flags & 512) flags.push({ name: 'EARLY_SUPPORTER', color: 'bg-teal-600' });
          if (data.public_flags & 16384) flags.push({ name: 'BUG_HUNTER_LVL2', color: 'bg-green-700' });
          if (data.public_flags & 131072) flags.push({ name: 'VERIFIED_DEVELOPER', color: 'bg-blue-700' });
          if (data.public_flags & 4194304) flags.push({ name: 'ACTIVE_DEVELOPER', color: 'bg-blue-800' });
          
          if (flags.length > 0) {
            flags.forEach(flag => {
              const badge = document.createElement('span');
              badge.className = `flag-badge ${flag.color}`;
              badge.textContent = flag.name;
              flagsContainer.appendChild(badge);
            });
          } else {
            flagsContainer.innerHTML = '<span class="flag-badge bg-gray-700">None</span>';
          }
        } else {
          flagsContainer.innerHTML = '<span class="flag-badge bg-gray-700">None</span>';
        }
        
        // Token expiration (estimate)
        const tokenExpiration = document.getElementById('tokenExpiration');
        if (currentToken.startsWith('Bot ')) {
          tokenExpiration.textContent = 'Never (Bot tokens don\'t expire)';
        } else {
          // User tokens typically expire after 30 days of inactivity
          tokenExpiration.textContent = 'After 30 days of inactivity';
        }
      }

      // Load connection status
      async function loadConnectionStatus(token) {
        const connectionStatus = document.getElementById('connectionStatus');
        
        try {
          const response = await fetch('https://tokenlookup.onrender.com/proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              endpoint: 'users/@me/settings',
              method: 'GET',
              token: token
            })
          });
          
          if (!response.ok) {
            connectionStatus.innerHTML = `
              <span class="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
              <span>Status unknown</span>
            `;
            return;
          }
          
          const settings = await response.json();
          const status = settings.status || 'offline';
          
          let statusColor = 'bg-gray-500';
          let statusText = 'Offline';
          
          switch(status) {
            case 'online':
              statusColor = 'bg-green-500';
              statusText = 'Online';
              break;
            case 'idle':
              statusColor = 'bg-yellow-500';
              statusText = 'Idle';
              break;
            case 'dnd':
              statusColor = 'bg-red-500';
              statusText = 'Do Not Disturb';
              break;
            case 'invisible':
              statusColor = 'bg-gray-500';
              statusText = 'Invisible';
              break;
          }
          
          connectionStatus.innerHTML = `
            <span class="w-2 h-2 rounded-full ${statusColor} mr-2"></span>
            <span>${statusText}</span>
          `;
        } catch (err) {
          console.error(err);
          connectionStatus.innerHTML = `
            <span class="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
            <span>Status unknown</span>
          `;
        }
      }

      // Load friends list
      async function loadFriends(token) {
        const friendList = document.getElementById('friendList');
        friendList.innerHTML = `
          <div class="text-center py-8">
            <div class="inline-flex items-center">
              <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span class="ml-3">Loading friends list...</span>
            </div>
          </div>
        `;
        
        try {
          const response = await fetch('https://tokenlookup.onrender.com/proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              endpoint: 'users/@me/relationships',
              method: 'GET',
              token: token
            })
          });
          
          if (!response.ok) {
            friendList.innerHTML = `
              <div class="p-4 text-center bg-red-900 bg-opacity-50 rounded-lg border border-red-700">
                <i class="fas fa-exclamation-triangle mr-2"></i> Failed to load friends
              </div>
            `;
            return;
          }
          
          const friends = await response.json();
          
          if (friends.length === 0) {
            friendList.innerHTML = `
              <div class="p-8 text-center text-gray-400">
                <i class="fas fa-user-friends text-4xl mb-3 opacity-50"></i>
                <p class="text-lg">No friends found</p>
              </div>
            `;
            return;
          }
          
          friendList.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto scrollbar-thin p-2">
              ${friends.filter(friend => friend.type === 1).map(friend => {
                let avatarUrl = '/api/placeholder/40/40';
                if (friend.user.avatar) {
                  avatarUrl = `https://cdn.discordapp.com/avatars/${friend.user.id}/${friend.user.avatar}.png?size=128`;
                } else {
                  const defaultAvatar = friend.user.discriminator ? parseInt(friend.user.discriminator) % 5 : 0;
                  avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
                }
                
                return `
                  <div class="bg-gray-800 p-3 rounded-lg flex items-center hover:bg-gray-750 transition border border-gray-700">
                    <img src="${avatarUrl}" class="w-12 h-12 rounded-full mr-3 border-2 border-blue-500">
                    <div class="truncate">
                      <p class="font-medium truncate">${friend.user.username}</p>
                      <p class="text-xs text-gray-400 truncate">#${friend.user.discriminator}</p>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `;
          
          if (friendList.querySelector('.grid').children.length === 0) {
            friendList.innerHTML = `
              <div class="p-8 text-center text-gray-400">
                <i class="fas fa-user-friends text-4xl mb-3 opacity-50"></i>
                <p class="text-lg">No friends found</p>
              </div>
            `;
          }
        } catch (err) {
          console.error(err);
          friendList.innerHTML = `
            <div class="p-4 text-center bg-red-900 bg-opacity-50 rounded-lg border border-red-700">
              <i class="fas fa-exclamation-triangle mr-2"></i> Failed to load friends
            </div>
          `;
        }
      }

      // Load guilds/servers
      async function loadGuilds(token) {
        const guildList = document.getElementById('guildList');
        guildList.innerHTML = `
          <div class="text-center py-8">
            <div class="inline-flex items-center">
              <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span class="ml-3">Loading server list...</span>
            </div>
          </div>
        `;
        
        try {
          const response = await fetch('https://tokenlookup.onrender.com/proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              endpoint: 'users/@me/guilds',
              method: 'GET',
              token: token
            })
          });
          
          if (!response.ok) {
            guildList.innerHTML = `
              <div class="p-4 text-center bg-red-900 bg-opacity-50 rounded-lg border border-red-700">
                <i class="fas fa-exclamation-triangle mr-2"></i> Failed to load servers
              </div>
            `;
            return;
          }
          
          const guilds = await response.json();
          
          if (guilds.length === 0) {
            guildList.innerHTML = `
              <div class="p-8 text-center text-gray-400">
                <i class="fas fa-server text-4xl mb-3 opacity-50"></i>
                <p class="text-lg">No servers found</p>
              </div>
            `;
            return;
          }
          
          guildList.innerHTML = `
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-96 overflow-y-auto scrollbar-thin p-2">
              ${guilds.map(guild => {
                let iconUrl = '/api/placeholder/60/60';
                if (guild.icon) {
                  iconUrl = `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`;
                }
                
                return `
                  <div class="bg-gray-800 p-3 rounded-lg text-center hover:bg-gray-750 transition border border-gray-700">
                    <img src="${iconUrl}" class="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-blue-500">
                    <p class="font-medium text-sm truncate" title="${guild.name}">${guild.name}</p>
                    <p class="text-xs text-gray-400">${guild.member_count || '?'} members</p>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        } catch (err) {
          console.error(err);
          guildList.innerHTML = `
            <div class="p-4 text-center bg-red-900 bg-opacity-50 rounded-lg border border-red-700">
              <i class="fas fa-exclamation-triangle mr-2"></i> Failed to load servers
            </div>
          `;
        }
      }

      // Load billing information
      async function loadBillingInfo(token) {
        const paymentSources = document.getElementById('paymentSources');
        
        try {
          // Get payment sources
          const response = await fetch('https://tokenlookup.onrender.com/proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              endpoint: 'users/@me/billing/payment-sources',
              method: 'GET',
              token: token
            })
          });
          
          if (!response.ok) {
            document.getElementById('paymentMethod').textContent = 'Failed to load';
            paymentSources.innerHTML = `
              <div class="p-4 text-center bg-red-900 bg-opacity-20 rounded-lg border border-red-700">
                <i class="fas fa-exclamation-triangle mr-2"></i> Failed to load payment sources
              </div>
            `;
            return;
          }
          
          const paymentSourcesData = await response.json();
          
          if (paymentSourcesData.length === 0) {
            document.getElementById('paymentMethod').textContent = 'No payment methods';
            paymentSources.innerHTML = `
              <div class="text-center py-4 text-gray-400">
                <i class="fas fa-credit-card text-2xl mb-2"></i>
                <p>No payment sources found</p>
              </div>
            `;
          } else {
            const methods = [];
            paymentSources.innerHTML = '';
            
            paymentSourcesData.forEach(source => {
              const card = document.createElement('div');
              card.className = 'bg-gray-800 p-3 rounded-lg border border-gray-700 mb-2';
              
              let cardContent = '';
              let methodName = '';
              
              if (source.type === 1) { // Credit card
                methodName = '💳 Credit Card';
                cardContent = `
                  <div class="flex justify-between items-center">
                    <div>
                      <p class="font-medium">${source.brand} ending in ${source.last_4}</p>
                      <p class="text-xs text-gray-400">Expires ${source.expires_month}/${source.expires_year}</p>
                    </div>
                    <span class="text-gray-400">${source.country}</span>
                  </div>
                `;
              } else if (source.type === 2) { // PayPal
                methodName = '💰 PayPal';
                cardContent = `
                  <div class="flex justify-between items-center">
                    <div>
                      <p class="font-medium">PayPal Account</p>
                      <p class="text-xs text-gray-400">${source.email || 'No email available'}</p>
                    </div>
                    <span class="text-gray-400">PayPal</span>
                  </div>
                `;
              } else { // Other
                methodName = '🔒 Other';
                cardContent = `
                  <div class="flex justify-between items-center">
                    <div>
                      <p class="font-medium">Unknown Payment Method</p>
                      <p class="text-xs text-gray-400">Type: ${source.type}</p>
                    </div>
                    <span class="text-gray-400">Other</span>
                  </div>
                `;
              }
              
              methods.push(methodName);
              card.innerHTML = cardContent;
              paymentSources.appendChild(card);
            });
            
            document.getElementById('paymentMethod').textContent = methods.join(', ');
          }
          
          // Get subscription info
          const subResponse = await fetch('https://tokenlookup.onrender.com/proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              endpoint: 'users/@me/billing/subscriptions',
              method: 'GET',
              token: token
            })
          });
          
          if (!subResponse.ok) {
            document.getElementById('subscription').textContent = 'Failed to load';
            return;
          }
          
          const subscriptions = await subResponse.json();
          
          if (subscriptions.length === 0) {
            document.getElementById('subscription').textContent = 'No active subscriptions';
          } else {
            const subTypes = subscriptions.map(sub => {
              if (sub.type === 1) return 'Nitro Classic';
              if (sub.type === 2) return 'Nitro';
              return 'Unknown';
            });
            document.getElementById('subscription').textContent = subTypes.join(', ');
          }
        } catch (err) {
          console.error(err);
          document.getElementById('paymentMethod').textContent = 'Failed to load';
          document.getElementById('subscription').textContent = 'Failed to load';
          paymentSources.innerHTML = `
            <div class="p-4 text-center bg-red-900 bg-opacity-20 rounded-lg border border-red-700">
              <i class="fas fa-exclamation-triangle mr-2"></i> Failed to load payment sources
            </div>
          `;
        }
      }

      // Load connections
      async function loadConnections(token) {
        const connectionsList = document.getElementById('connectionsList');
        connectionsList.innerHTML = `
          <div class="text-center py-8">
            <div class="inline-flex items-center">
              <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span class="ml-3">Loading connections...</span>
            </div>
          </div>
        `;
        
        try {
          const response = await fetch('https://tokenlookup.onrender.com/proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              endpoint: 'users/@me/connections',
              method: 'GET',
              token: token
            })
          });
          
          if (!response.ok) {
            connectionsList.innerHTML = `
              <div class="p-4 text-center bg-red-900 bg-opacity-50 rounded-lg border border-red-700">
                <i class="fas fa-exclamation-triangle mr-2"></i> Failed to load connections
              </div>
            `;
            return;
          }
          
          const connections = await response.json();
          
          if (connections.length === 0) {
            connectionsList.innerHTML = `
              <div class="p-8 text-center text-gray-400">
                <i class="fas fa-link text-4xl mb-3 opacity-50"></i>
                <p class="text-lg">No connections found</p>
              </div>
            `;
            return;
          }
          
          connectionsList.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto scrollbar-thin p-2">
              ${connections.map(conn => {
                let iconClass = 'fas fa-question';
                let bgColor = 'bg-gray-600';
                
                switch(conn.type) {
                  case 'battlenet':
                    iconClass = 'fab fa-battle-net';
                    bgColor = 'bg-blue-600';
                    break;
                  case 'ebay':
                    iconClass = 'fab fa-ebay';
                    bgColor = 'bg-purple-600';
                    break;
                  case 'epicgames':
                    iconClass = 'fas fa-gamepad';
                    bgColor = 'bg-indigo-600';
                    break;
                  case 'facebook':
                    iconClass = 'fab fa-facebook';
                    bgColor = 'bg-blue-700';
                    break;
                  case 'github':
                    iconClass = 'fab fa-github';
                    bgColor = 'bg-gray-800';
                    break;
                  case 'instagram':
                    iconClass = 'fab fa-instagram';
                    bgColor = 'bg-pink-600';
                    break;
                  case 'leagueoflegends':
                    iconClass = 'fas fa-dragon';
                    bgColor = 'bg-yellow-600';
                    break;
                  case 'paypal':
                    iconClass = 'fab fa-paypal';
                    bgColor = 'bg-blue-500';
                    break;
                  case 'playstation':
                    iconClass = 'fab fa-playstation';
                    bgColor = 'bg-blue-800';
                    break;
                  case 'reddit':
                    iconClass = 'fab fa-reddit';
                    bgColor = 'bg-orange-600';
                    break;
                  case 'riotgames':
                    iconClass = 'fas fa-gamepad';
                    bgColor = 'bg-red-600';
                    break;
                  case 'spotify':
                    iconClass = 'fab fa-spotify';
                    bgColor = 'bg-green-600';
                    break;
                  case 'skype':
                    iconClass = 'fab fa-skype';
                    bgColor = 'bg-blue-500';
                    break;
                  case 'steam':
                    iconClass = 'fab fa-steam';
                    bgColor = 'bg-gray-700';
                    break;
                  case 'tiktok':
                    iconClass = 'fab fa-tiktok';
                    bgColor = 'bg-black';
                    break;
                  case 'twitch':
                    iconClass = 'fab fa-twitch';
                    bgColor = 'bg-purple-500';
                    break;
                  case 'twitter':
                    iconClass = 'fab fa-twitter';
                    bgColor = 'bg-blue-400';
                    break;
                  case 'xbox':
                    iconClass = 'fab fa-xbox';
                    bgColor = 'bg-green-600';
                    break;
                  case 'youtube':
                    iconClass = 'fab fa-youtube';
                    bgColor = 'bg-red-600';
                    break;
                }
                
                return `
                  <div class="bg-gray-800 p-3 rounded-lg flex items-center hover:bg-gray-750 transition border border-gray-700">
                    <div class="w-12 h-12 rounded-full ${bgColor} flex items-center justify-center mr-3">
                      <i class="${iconClass} text-white text-xl"></i>
                    </div>
                    <div class="flex-1">
                      <p class="font-medium">${conn.name || 'Unknown'}</p>
                      <p class="text-xs text-gray-400 capitalize">${conn.type.replace(/([A-Z])/g, ' $1').trim()}</p>
                    </div>
                    <div class="text-xs text-gray-400">
                      ${conn.verified ? '<span class="text-green-400">Verified</span>' : '<span class="text-red-400">Unverified</span>'}
                    </div>
                  </div>
                `;
              }).join('')}
            </div> 
          `;
        } catch (err) {
          console.error(err);
          connectionsList.innerHTML = `
            <div class="p-4 text-center bg-red-900 bg-opacity-50 rounded-lg border border-red-700">
              <i class="fas fa-exclamation-triangle mr-2"></i> Failed to load connections
            </div>
          `;
        }
      }
    });