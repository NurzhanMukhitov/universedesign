// Remove global flag
// let isIndexPageInitialLoad = true; 

document.addEventListener('DOMContentLoaded', function() {
    // Check flag for returning from another page
    if (sessionStorage.getItem('justLeftIndex') === 'true') {
        console.log("Found justLeftIndex flag, planning to open menu.");
        // Wrap menu opening in setTimeout to give browser time to render
        setTimeout(function() {
            openBurgerMenu(); // Open menu
            console.log("Menu opened after small delay.");
        }, 0); // Minimum delay
        sessionStorage.removeItem('justLeftIndex'); // Remove flag immediately
        console.log("justLeftIndex flag removed from sessionStorage.");
    }

    // Screen dimensions
    var ww = window.innerWidth, wh = window.innerHeight;

    // Get DOM elements
    var canvas = document.getElementById("c");
    var menuBtn = document.querySelector('.menu-btn');
    var logoText = document.querySelector('.logo-text');
    var overlayMask = document.querySelector('.overlay-mask');
    var gestureHint = document.querySelector('.gesture-hint');
    var gestureMask = document.querySelector('.gesture-mask');
    var activePopup = null;
    var menuOverlay = document.querySelector('.overlay-menu');
    var resetButton = document.querySelector('.reset-button');
    var backButton = document.querySelector('.back-button');
    var isMenuLocked = false;

    // Canvas setup with devicePixelRatio for better clarity
    // --- Restore original dpr value ---
    var dpr = window.devicePixelRatio || 1;
    // --- End of dpr restore ---
    canvas.width = ww * dpr;
    canvas.height = wh * dpr;
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    canvas.style.width = ww + "px";
    canvas.style.height = wh + "px";

    // Cube parameters
    var linesX = 14;
    var linesY = 14; // Always 14
    var pointsPerLine = getPointsPerLine(); // Dynamic value
    var letters = "UNIVERSEDESIGN";
    var focale = 500; // Static value for all
    var defaultRotationX = -0.4, defaultRotationY = 0.5;
    var autoRotateSpeed = 0.0002;
    
    // >>> GLOBAL VARIABLES FOR ROTATION OPTIMIZATION <<<
    var currentSinX = 0, currentCosX = 1, currentSinY = 0, currentCosY = 1;
    // >>> END OF GLOBAL VARIABLES <<<

    // >>> DECLARE FONT VARIABLES GLOBALLY <<<
    var baseFontSize;
    var boldFontSize;
    // >>> END OF DECLARATION <<<

    // Letter highlighting parameters
    var highlightedPoints = new Set();
    var currentLetterIndex = 0;
    var letterHighlightDuration = 8000; // Reduce overall cycle duration
    var lastHighlightTime = 0;
    var highlightIntensity = 0;
    var fadeSpeed = 0.1;
    var canStartHighlight = false;

    // Determine cube state based on localStorage
    var forceChaotic = localStorage.getItem('force_chaotic_cube') === 'true';
    
    if (forceChaotic) {
        tParam = 1;
        rotationX = 0;
        rotationY = 0;
        
        localStorage.removeItem('force_chaotic_cube');
        
        if (gestureHint && gestureMask) {
            gestureHint.style.display = 'flex';
            gestureMask.style.display = 'block';
            gestureHint.classList.add('visible');
            gestureMask.classList.add('visible');
            
            canvas.style.pointerEvents = 'none';
            setTimeout(() => {
                canvas.style.pointerEvents = 'auto';
                setTimeout(() => {
                    canStartHighlight = true;
                }, 1000);
            }, 3500);
        }
    } else {
        tParam = 0;
        rotationX = defaultRotationX;
        rotationY = defaultRotationY;
        
        if (gestureHint && gestureMask) {
            gestureHint.style.display = 'none';
            gestureMask.style.display = 'none';
        }
        
        if (menuBtn && logoText) {
            menuBtn.style.display = 'block';
            logoText.style.display = 'block';
            menuBtn.classList.add('visible');
            logoText.classList.add('visible');
        }
    }

    // Gesture control
    var drag = false;
    var oldX = 0;
    var oldY = 0;
    var scrollAccumulator = 0;
    var scrollThreshold = 100;
    var touchStartY = 0;

    // For animation
    var lastTime = 0;

    // Points array
    var pointsArray = [];

    /**
     * Point class for 3D cube points
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} z - Z coordinate
     */
    function Point(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.originalX = x;
        this.originalY = y;
        this.originalZ = z;
        this.scatterX = Math.random() * 2000 - 1000;
        this.scatterY = Math.random() * 2000 - 1000;
        this.scatterZ = Math.random() * 2000 - 1000;
    }

    /**
     * Rotate point around X axis
     * @param {number} angle - Rotation angle in radians
     */
    Point.prototype.rotateX = function(angle) {
        var cosA = Math.cos(angle), sinA = Math.sin(angle);
        var y = this.y * cosA - this.z * sinA;
        var z = this.y * sinA + this.z * cosA;
        this.y = y; this.z = z;
    };

    /**
     * Rotate point around Y axis
     * @param {number} angle - Rotation angle in radians
     */
    Point.prototype.rotateY = function(angle) {
        var cosA = Math.cos(angle), sinA = Math.sin(angle);
        var x = this.x * cosA + this.z * sinA;
        var z = -this.x * sinA + this.z * cosA;
        this.x = x; this.z = z;
    };

    /**
     * Draw point on canvas with appropriate styling
     * @param {number} i - X index
     * @param {number} j - Y index
     */
    Point.prototype.draw = function(i, j) {
        var scale = focale / (focale + this.z);
        var idx = i * linesY * pointsPerLine + j * pointsPerLine;

        // >>> DETERMINE FONT SIZE <<<
        var w = window.innerWidth;
        var baseFontSize = (w < 768) ? 8 : 14; // Base size
        var boldFontSize = (w < 768) ? 8 : 14; // Same size for all states
        
        if (tParam >= 0.9 && highlightedPoints.has(idx)) {
            // Highlighted letters
            ctx.font = `bold ${boldFontSize}px OneDay`;
            // Use z-coordinate for brightness calculation
            var zBrightness = 1 - (this.z + 1000) / 2000;
            zBrightness = Math.max(0.4, Math.min(1, zBrightness)); // Limit minimum brightness
            var finalOpacity = zBrightness * (0.6 + highlightIntensity * 0.4);
            ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity})`;
            // Add glow effect
            ctx.shadowColor = `rgba(255, 255, 255, ${finalOpacity * 0.8})`;
            ctx.shadowBlur = 20 * zBrightness;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else if (j === linesY - 1 && tParam <= 0.1) {
            // Gathered state
            ctx.font = `bold ${boldFontSize}px OneDay`;
            ctx.fillStyle = "#ffffff";
            // Reset shadows
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        } else {
            // Normal state
            ctx.font = `${baseFontSize}px OneDay`;
            var bf = 1 - (this.z + 1000) / 2000;
            bf = Math.max(0, Math.min(1, bf));
            var shade = Math.floor(20 + bf * 127); // Make non-highlighted letters darker
            ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
            // Reset shadows
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        var xPos = ww / 2 + this.x * scale;
        var yPos = wh / 2 + this.y * scale;
        var text = letters[i % letters.length];
        ctx.fillText(text, xPos, yPos);
    };

    /**
     * Determines the number of points per line based on screen width
     * @returns {number} Number of points per line (8 for mobile, 10 for desktop)
     */
    function getPointsPerLine() {
        var w = window.innerWidth;
        if (w < 768) return 8; // Mobile: 8 rows
        return 10; // Desktop: 10 rows
    }

    /**
     * Determines the cube size based on screen width
     * @returns {number} Cube size in pixels
     */
    function getCubeSize() {
        var w = window.innerWidth;
        if (w < 576) return 220; // Return 220 (was 200)
        if (w < 768) return 280; // Make slightly larger (was 260)
        // Other sizes unchanged
        if (w < 992) return 260;
        if (w < 1200) return 300;
        if (w < 1400) return 340;
        return 360;
    }

    /**
     * Creates all 3D points for the cube
     */
    function createPoints() {
        pointsArray = [];
        var cubeSize = getCubeSize();
        // >>> RESTORE STANDARD Z-CALCULATION <<<
        var topZ = cubeSize / 2;
        var botZ = -cubeSize / 2;
        // >>> END OF CHANGE <<<
        var spaceX = cubeSize / linesX;
        var spaceY = cubeSize / linesY;

        for (var j = 0; j < linesY; j++) {
            for (var i = 0; i < linesX; i++) {
                var x = -cubeSize / 2 + i * spaceX;
                var y = -cubeSize / 2 + j * spaceY;
                // pointsPerLine remains dynamic (8 or 10)
                for (var k = 0; k < pointsPerLine; k++) {
                    // Use standard topZ/botZ
                    var z = topZ + (botZ - topZ) / pointsPerLine * k;
                    var point = new Point(x, y, z);
                    pointsArray.push(point);
                }
            }
        }
    }
    createPoints();

    /**
     * Draws all points of the cube
     */
    function drawPoints() {
        for (var i = 0; i < linesX; i++) {
            for (var j = 0; j < linesY; j++) {
                for (var k = 0; k < pointsPerLine; k++) {
                    var idx = i * linesY * pointsPerLine + j * pointsPerLine + k;
                    var point = pointsArray[idx];
                    // Coordinate interpolation
                    var px = (1 - tParam) * point.originalX + tParam * point.scatterX;
                    var py = (1 - tParam) * point.originalY + tParam * point.scatterY;
                    var pz = (1 - tParam) * point.originalZ + tParam * point.scatterZ;
                    
                    // >>> Direct rotation application <<<
                    // X rotation
                    var rotatedY1 = py * currentCosX - pz * currentSinX;
                    var rotatedZ1 = py * currentSinX + pz * currentCosX;
                    // Y rotation
                    var rotatedX2 = px * currentCosY + rotatedZ1 * currentSinY;
                    var rotatedZ2 = -px * currentSinY + rotatedZ1 * currentCosY;
                    
                    // Update point coordinates before drawing
                    point.x = rotatedX2;
                    point.y = rotatedY1;
                    point.z = rotatedZ2;
                    // >>> End of rotation application <<<
                    
                    point.draw(i, j);
                }
            }
        }
    }

    /**
     * Main render function called on each animation frame
     * @param {number} time - Current timestamp
     */
    function render(time) {
        // >>> CALCULATE FONTS ONCE PER FRAME <<<
        var w = window.innerWidth;
        baseFontSize = (w < 768) ? 8 : 14;
        boldFontSize = (w < 768) ? 12 : 14;
        // >>> END OF FONT CALCULATION <<<

        // >>> CALCULATE SIN/COS FOR ROTATION ONCE PER FRAME <<<
        currentSinX = Math.sin(rotationX);
        currentCosX = Math.cos(rotationX);
        currentSinY = Math.sin(rotationY);
        currentCosY = Math.cos(rotationY);
        // >>> END OF SIN/COS CALCULATION <<<

        var deltaTime = time - lastTime;
        lastTime = time;

        if (deltaTime > 100) deltaTime = 100;

        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, ww, wh);

        // Update letter highlighting
        updateLetterHighlight(time);
        
        drawPoints();

        if (!drag) {
            rotationY += autoRotateSpeed * deltaTime;
        }
        
        // Check cube state and update element visibility
        if (tParam === 0) {
            // Cube is gathered - show elements and lock menu
            if (menuBtn.style.display !== "block") {
                menuBtn.style.display = "block";
                logoText.style.display = "block";
                menuBtn.classList.add('visible');
                logoText.classList.add('visible');
                isMenuLocked = true; // Lock menu when cube is gathered
                // Automatically open menu
                menuOverlay.style.display = "block";
                requestAnimationFrame(() => {
                    menuOverlay.classList.add('visible');
                });
            }
            // Always maintain menu lock when cube is gathered
            isMenuLocked = true;
        } else {
            // Cube is scattered - hide elements and unlock menu
            if (menuBtn.style.display !== "none") {
                menuBtn.classList.remove('visible');
                logoText.classList.remove('visible');
                menuBtn.style.display = "none";
                logoText.style.display = "none";
                isMenuLocked = false; // Unlock menu
                // Hide menu
                menuOverlay.classList.remove('visible');
                setTimeout(() => {
                    menuOverlay.style.display = "none";
                }, 400);
            }
        }

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    /**
     * Handles window resize event
     */
    function handleResize() {
        // Update window dimensions
        ww = window.innerWidth;
        wh = window.innerHeight;

        // Update canvas dimensions with devicePixelRatio
        // --- Restore original dpr value ---
        var dpr = window.devicePixelRatio || 1;
        // --- End of dpr restore ---
        // Check if canvas and ctx exist before using
        if (canvas && ctx) {
            canvas.width = ww * dpr;
            canvas.height = wh * dpr;
            ctx.scale(dpr, dpr); // Important to reset and reapply scale
            canvas.style.width = ww + "px";
            canvas.style.height = wh + "px";
        } else {
            console.error("Canvas or context not found during resize.");
            return; // Stop execution if canvas/ctx doesn't exist
        }

        // Update cube parameters
        pointsPerLine = getPointsPerLine();

        // Recreate points with new parameters
        createPoints();

        // Update log with static focale value
        console.log(`Resized. New params: Size=${getCubeSize()}, Focale=${focale}, LinesY=${linesY}, PointsPerLine=${pointsPerLine}`);
    }

    // Add resize event handler
    // Check if there's already an existing handler to avoid duplication
    // (Simple approach - add anyway, but better to check)
    // For now, just add:
    window.addEventListener('resize', handleResize);

    // Ensure first initial call to createPoints() happens after handleResize is determined
    // (In your code createPoints() is called before first call, which is normal for first call)

    /**
     * Event listeners for mouse interactions
     */
    canvas.addEventListener('mousedown', function(e) {
        handleStart(e.pageX, e.pageY);
    });
    canvas.addEventListener('mousemove', function(e) {
        handleMove(e.pageX, e.pageY);
    });
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);

    /**
     * Event listeners for touch interactions
     */
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchStartY = e.touches[0].pageY;
        handleStart(e.touches[0].pageX, e.touches[0].pageY);
    }, { passive: false });

    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault();
        var touchY = e.touches[0].pageY;
        var deltaY = touchY - touchStartY;
        handleScroll(-deltaY);
        handleMove(e.touches[0].pageX, e.touches[0].pageY);
        touchStartY = touchY;
    }, { passive: false });

    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        handleEnd();
    }, { passive: false });

    /**
     * Handles mouse/touch movement for rotation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    function handleMove(x, y) {
        if (drag) {
            rotationY += (x - oldX) * 0.01;
            rotationX += (y - oldY) * 0.01;
            oldX = x;
            oldY = y;
        }
    }

    /**
     * Handles start of mouse/touch interaction
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    function handleStart(x, y) {
        drag = true;
        oldX = x;
        oldY = y;
    }

    /**
     * Handles end of mouse/touch interaction
     */
    function handleEnd() {
        drag = false;
    }

    /**
     * Handles scroll for cube transformation
     * @param {number} deltaY - Scroll delta
     */
    function handleScroll(deltaY) {
        scrollAccumulator += deltaY;
        
        if (scrollAccumulator > scrollThreshold) {
            animateScatter();
            scrollAccumulator = 0;
        } else if (scrollAccumulator < -scrollThreshold) {
            animateGather();
            scrollAccumulator = 0;
        }
    }

    // Wheel event listener
    canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
        handleScroll(e.deltaY);
    });

    /**
     * Animates cube gathering (from scattered to compact state)
     */
    function animateGather() {
        console.log("Animating gather");
        
        // If cube is already gathered, do nothing
        if (tParam === 0) {
            console.log("Cube already gathered");
            return;
        }
        
        var startTime = performance.now();
        var initT = tParam;
        var duration = 1500;
        
        /**
         * Animation step function
         * @param {number} currentTime - Current animation timestamp
         */
        function step(currentTime) {
            var elapsed = currentTime - startTime;
            var progress = Math.min(elapsed / duration, 1);
            tParam = initT * (1 - progress);
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                tParam = 0;
            }
        }
        requestAnimationFrame(step);
    }

    /**
     * Animates cube scattering (from compact to scattered state)
     */
    function animateScatter() {
        console.log("Animating scatter");
        
        // If cube is already scattered, do nothing
        if (tParam === 1) {
            console.log("Cube already scattered");
            return;
        }
        
        // Hide all overlays when scattering starts
        var overlays = document.querySelectorAll('.overlay-menu, .popup-block, .overlay-mask');
        overlays.forEach(function(el) {
            if (el.style.display !== "none") {
                el.classList.remove('visible');
                setTimeout(() => {
                    el.style.display = "none";
                }, 400);
            }
        });
        
        var startTime = performance.now();
        var initT = tParam;
        var duration = 1500;
        
        /**
         * Animation step function
         * @param {number} currentTime - Current animation timestamp
         */
        function step(currentTime) {
            var elapsed = currentTime - startTime;
            var progress = Math.min(elapsed / duration, 1);
            tParam = initT + (1 - initT) * progress;
            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                tParam = 1;
            }
        }
        requestAnimationFrame(step);
    }

    /**
     * Opens the burger menu
     */
    function openBurgerMenu() {
        console.log('openBurgerMenu called');
        const menuOverlay = document.querySelector('.overlay-menu');
        if (menuOverlay) {
            console.log('Element .overlay-menu found');
            menuOverlay.style.display = 'block';
            requestAnimationFrame(() => {
                menuOverlay.classList.add('visible');
                console.log('visible class added to .overlay-menu');
            });
        } else {
            console.error('Element .overlay-menu not found');
        }
    }

    if (logoText) {
        // Remove logo click handler
        logoText.style.pointerEvents = 'none';
        logoText.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
    }

    // Check if all elements are found
    console.log('DOM Elements:', {
        overlayMask: overlayMask,
        menuOverlay: menuOverlay,
        menuBtn: menuBtn
    });

    // Mask click handler
    if (overlayMask) {
        overlayMask.addEventListener('click', function(e) {
            console.log('Mask click:', {
                target: e.target,
                isMask: e.target === overlayMask,
                activePopup: activePopup ? activePopup.id : null
            });
            
            // Hide popup when clicking on mask
            hidePopup();
        });
    }

    // Outside popup click handler
    document.addEventListener('click', function(e) {
        if (!activePopup) return;
        
        // Check if click was inside popup content
        const isClickInsideContent = e.target.closest('.popup-content');
        // Check if click was on menu
        const isClickOnMenu = e.target.closest('.overlay-menu') || e.target.closest('.menu-btn');
        // Check if click was on mask
        const isClickOnMask = e.target === overlayMask;
        
        console.log('Click:', {
            target: e.target,
            isClickInsideContent,
            isClickOnMenu,
            isClickOnMask,
            activePopupId: activePopup ? activePopup.id : null
        });

        // Hide popup only if click was outside popup content and not on menu
        if (!isClickInsideContent && !isClickOnMenu) {
            hidePopup();
        }
    });

    // Escape key handler
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && activePopup) {
            console.log("Closing popup by Escape");
            hidePopup();
        }
    });

    /**
     * Hides the popup element
     */
    function hidePopup() {
        if (!activePopup) return;
        
        console.log('Closing popup:', activePopup.id);
        
        overlayMask.classList.remove('visible');
        activePopup.classList.remove('visible');
        
        setTimeout(function() {
            overlayMask.style.display = 'none';
            activePopup.style.display = 'none';
            activePopup = null;
            }, 400);
        }

    /**
     * Shows a popup by ID
     * @param {string} popupId - ID of the popup element to show
     */
    function showPopup(popupId) {
        var popup = document.getElementById(popupId);
        if (!popup) {
            console.error('Popup not found:', popupId);
            return;
        }
        
        console.log('Showing popup:', popupId);
        
        // Hide previous popup if it exists
        if (activePopup) {
            hidePopup();
        }
        
        activePopup = popup;
        
        // Show mask and popup
        overlayMask.style.display = 'block';
        popup.style.display = 'block';
        
        // Give browser time to process display change
        requestAnimationFrame(function() {
            overlayMask.classList.add('visible');
            popup.classList.add('visible');
        });
    }

    // Menu handlers
    if (menuOverlay) {
        var menuItems = menuOverlay.querySelectorAll('li a');
        menuItems.forEach(function(item) {
            item.addEventListener('click', function(event) {
                // Get section ID from data-attribute
                const sectionId = this.getAttribute('data-section');
                // Get href
                const href = this.getAttribute('href');

                // Set flag in sessionStorage before transition, if it's not a popup
                if (!sectionId && href && href !== '#' && !href.startsWith('javascript:')) {
                    sessionStorage.setItem('justLeftIndex', 'true');
                    console.log("justLeftIndex flag set in sessionStorage");
                }

                if (sectionId) {
                    // If there's data-section, show popup
                    event.preventDefault(); // Cancel standard behavior ONLY for popups
                    showPopup(sectionId);
                    // Close menu
                    menuOverlay.classList.remove('visible');
                    overlayMask.classList.remove('visible');
                    menuBtn.classList.remove('active');
                } else if (href && href !== '#' && !href.startsWith('javascript:')) {
                    // If there's a valid href, allow browser to navigate
                    // Also close menu if it was open
                    menuOverlay.classList.remove('visible');
                    overlayMask.classList.remove('visible');
                    menuBtn.classList.remove('active');
                    // Standard href navigation will happen automatically
                } else {
                    // If there's no sectionId, nor valid href, cancel action
                    event.preventDefault(); 
                }
            });
        });
    }

    /**
     * Hides the gesture hint element
     */
    function hideGestureHint() {
        if (gestureHint && gestureHint.classList.contains('visible')) {
            gestureHint.classList.remove('visible');
            gestureMask.classList.remove('visible');
            setTimeout(() => {
                gestureHint.style.display = 'none';
                gestureMask.style.display = 'none';
            }, 450);
        }
    }

    // Add gesture hint hiding event listeners
    canvas.addEventListener('mousedown', hideGestureHint);
    canvas.addEventListener('touchstart', hideGestureHint);
    canvas.addEventListener('wheel', hideGestureHint);

    /**
     * Gets random point index for a specific letter
     * @param {string} letter - The letter to find points for
     * @returns {number} Random point index for the specified letter
     */
    function getRandomPointIndexForLetter(letter) {
        var indices = [];
        for (var i = 0; i < linesX; i++) {
            for (var j = 0; j < linesY; j++) {
                for (var k = 0; k < pointsPerLine; k++) {
                    var idx = i * linesY * pointsPerLine + j * pointsPerLine + k;
                    if (letters[i % letters.length] === letter) {
                        indices.push(idx);
                    }
                }
            }
        }
        return indices[Math.floor(Math.random() * indices.length)];
    }

    /**
     * Updates letter highlighting effect
     * @param {number} time - Current animation timestamp
     */
    function updateLetterHighlight(time) {
        if (!lastHighlightTime) lastHighlightTime = time;
        
        if (!canStartHighlight || tParam < 0.9) {
            highlightedPoints.clear();
            return;
        }

        var deltaTime = time - lastHighlightTime;
        
        // Update highlighting intensity with smoother pulsation
        if (highlightedPoints.size > 0) {
            // Combine several sine waves with different frequencies for smoother pulsation
            var pulse1 = Math.sin(time * 0.0005) * 0.5; // Very slow pulsation
            var pulse2 = Math.sin(time * 0.001) * 0.3; // Medium pulsation
            var pulse3 = Math.sin(time * 0.002) * 0.2; // Fast pulsation
            highlightIntensity = (pulse1 + pulse2 + pulse3 + 1) / 2; // Normalize to 0-1 range
        }

        // Check if new letter needs to be added
        if (deltaTime > letterHighlightDuration / letters.length) {
            // Find all possible indices for current letter
            var indices = [];
            var currentLetter = letters[currentLetterIndex];
            
            for (var i = 0; i < linesX; i++) {
                for (var j = 0; j < linesY; j++) {
                    for (var k = 0; k < pointsPerLine; k++) {
                        var idx = i * linesY * pointsPerLine + j * pointsPerLine + k;
                        if (letters[i % letters.length] === currentLetter) {
                            indices.push(idx);
                        }
                    }
                }
            }
            
            // Add more points for current letter
            var pointsToAdd = Math.min(8, indices.length); // Increase number of highlighted points
            for (var p = 0; p < pointsToAdd; p++) {
                if (indices.length > 0) {
                    var randomIndex = Math.floor(Math.random() * indices.length);
                    highlightedPoints.add(indices[randomIndex]);
                    indices.splice(randomIndex, 1);
                }
            }
            
            // Move to next letter
            currentLetterIndex = (currentLetterIndex + 1) % letters.length;
            
            // If started new word, DO NOT clear old highlights
            // Removed: if (currentLetterIndex === 0) { highlightedPoints.clear(); }
            
            lastHighlightTime = time;
        }
    }

    // Reset button handler
    if (resetButton) {
        resetButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Set flag for forced update
            localStorage.setItem('force_chaotic_cube', 'true');
            
            // Reload page
            window.location.reload();
        });
    }
    
    // Cmd+Shift+R (and Ctrl+Shift+R for Windows/Linux) key combination handler
    document.addEventListener('keydown', function(e) {
        // Check key combination (Cmd/Ctrl + Shift + R)
        if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'r' || e.key === 'R')) {
            console.log("Key combination for reset detected");
            
            // Prevent standard browser behavior
            e.preventDefault();
            e.stopPropagation();
            
            // Set flag for forced update
            localStorage.setItem('force_chaotic_cube', 'true');
            
            // Reload page
            setTimeout(function() {
                window.location.reload();
            }, 50);
            
            return false;
        }
    }, true); // Add third parameter true for capture phase

    // Fullscreen viewing functions
    let currentFullscreenIndex = 0;
    let fullscreenImages = [];

    /**
     * Opens fullscreen view for a media element
     * @param {HTMLElement} mediaElement - Image or video element to show in fullscreen
     */
    function openFullscreen(mediaElement) {
        // Remove old fullscreenView if it exists
        if (fullscreenView) {
            fullscreenView.remove();
        }

        // Create new fullscreenView each time
        fullscreenView = document.createElement('div');
        fullscreenView.style.backgroundColor = "#000"; // Black background
        fullscreenView.className = 'fullscreen-view';
        document.body.appendChild(fullscreenView);
        
        // Block page scrolling
        console.log("Setting overflow: hidden on html and body");
        document.documentElement.style.setProperty('overflow', 'hidden', 'important'); // For html
        document.body.style.setProperty('overflow', 'hidden', 'important'); // For body

        const content = document.createElement('div');
        content.className = 'fullscreen-content';
        fullscreenView.appendChild(content);

        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'fullscreen-media';
        content.appendChild(mediaContainer);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'close-fullscreen';
        closeBtn.innerHTML = '×';
        content.appendChild(closeBtn);

        // Add next button only for desktops
        if (window.innerWidth > 768) {
            const nextBtn = document.createElement('button');
            nextBtn.className = 'next-fullscreen';
            content.appendChild(nextBtn);

            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showNextImage();
            });
        }
        
        // Add event handlers
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            closeFullscreen();
        });

        fullscreenMedia = mediaContainer;

        // Get all images and videos in current project
        const projectContent = mediaElement.closest('.modal-slides');
        fullscreenImages = Array.from(projectContent.querySelectorAll('.slide img, iframe:not([src*="player.vimeo.com/api"])'));
        currentFullscreenIndex = fullscreenImages.indexOf(mediaElement);

        // Show content
        showCurrentMedia();
        
        // Add key handlers
        document.addEventListener('keydown', handleFullscreenKeyPress);

        // Activate fullscreen mode
        requestAnimationFrame(() => {
            fullscreenView.classList.add('active');
        });

        // Swipe handlers for mobile devices
        let touchStartX = 0;
        let touchStartY = 0;
        let isSwiping = false; // Swipe flag
        
        /**
         * Handles touch start event
         * @param {TouchEvent} e - Touch event
         */
        function handleTouchStart(e) {
            if (e.touches.length !== 1) return; // Only one touch
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            isSwiping = true; // Start tracking swipe
            console.log(`TouchStart: x=${touchStartX.toFixed(2)}, y=${touchStartY.toFixed(2)}`);
        }
        
        /**
         * Handles touch move event
         * @param {TouchEvent} e - Touch event
         */
        function handleTouchMove(e) {
            if (!isSwiping || e.touches.length !== 1) return;
            console.log(`TouchMove: x=${e.touches[0].clientX.toFixed(2)}, y=${e.touches[0].clientY.toFixed(2)}`);
            // Block page scrolling during swipe
            e.preventDefault();
        }
        
        /**
         * Handles touch end event
         * @param {TouchEvent} e - Touch event
         */
        function handleTouchEnd(e) {
            if (!isSwiping || e.changedTouches.length !== 1) {
                isSwiping = false;
                return;
            }
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            // Calculate swipe distance
            const swipeDistanceX = touchEndX - touchStartX;
            const swipeDistanceY = touchEndY - touchStartY; // Don't use Math.abs here for direction determination
            
            console.log(`TouchEnd: x=${touchEndX.toFixed(2)}, y=${touchEndY.toFixed(2)}`);
            console.log(`Swipe Distance: dX=${swipeDistanceX.toFixed(2)}, dY=${swipeDistanceY.toFixed(2)}`);
            
            isSwiping = false; // Swipe ended

            // Check if swipe was predominantly horizontal (|dx| > |dy| * 1.5 - increase threshold)
            if (Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY) * 1.5) {
                // Minimum swipe distance - 10% of screen width
                const minSwipeDistance = window.innerWidth * 0.1;
                console.log(`Horizontal swipe detected. Min distance: ${minSwipeDistance.toFixed(2)}`);
                
                if (Math.abs(swipeDistanceX) > minSwipeDistance) {
                    console.log("Swipe distance threshold met.");
                    if (swipeDistanceX > 0) {
                        console.log("Executing showPreviousImage()");
                        // Swipe right - previous image
                        showPreviousImage();
                    } else {
                        console.log("Executing showNextImage()");
                        // Swipe left - next image
                        showNextImage();
                    }
                } else {
                    console.log("Swipe distance threshold NOT met.");
                }
            } else {
                console.log("Swipe is more vertical or diagonal, ignored.");
            }
        }
        
        // Add swipe handlers
        fullscreenView.addEventListener('touchstart', handleTouchStart, { passive: false });
        fullscreenView.addEventListener('touchmove', handleTouchMove, { passive: false });
        fullscreenView.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        // Save references to handlers for removal when closing
        fullscreenView.touchHandlers = {
            start: handleTouchStart,
            move: handleTouchMove,
            end: handleTouchEnd
        };

        // Add swipe indicator for mobile
        if (window.innerWidth <= 768) {
            const swipeIndicator = document.createElement('div');
            swipeIndicator.className = 'swipe-indicator';
            swipeIndicator.textContent = 'Swipe for navigation';
            content.appendChild(swipeIndicator);
            
            // Hide indicator after 3 seconds
            setTimeout(() => {
                swipeIndicator.remove();
            }, 3000);
        }
    }

    /**
     * Shows current media in fullscreen view
     */
    function showCurrentMedia() {
        const media = fullscreenImages[currentFullscreenIndex];
        
        // Clear container
        fullscreenMedia.innerHTML = '';
        
        if (media.tagName.toLowerCase() === 'iframe') {
            // Create static preloader
            const preloader = document.createElement('div');
            preloader.textContent = 'Loading video...'; // Video preloader text
            preloader.style.fontSize = '18px';
            preloader.style.color = '#fff';
            preloader.style.textAlign = 'center';
            preloader.style.padding = '20px';
            fullscreenMedia.appendChild(preloader);
            
            // Load video after preloader
            const iframe = document.createElement('iframe');
            iframe.src = media.src;
            iframe.width = '100%';
            iframe.height = '100%';
            iframe.style.aspectRatio = '16/9';
            iframe.frameBorder = '0';
            iframe.allow = 'autoplay; fullscreen; picture-in-picture';
            iframe.onload = function() {
                fullscreenMedia.innerHTML = ''; // Clear container before adding video
                fullscreenMedia.appendChild(iframe);
            };
        } else {
            // Clone image
            const clone = media.cloneNode();
            fullscreenMedia.appendChild(clone);
        }
    }

    /**
     * Shows next image in fullscreen view
     */
    function showNextImage() {
        currentFullscreenIndex = (currentFullscreenIndex + 1) % fullscreenImages.length;
        showCurrentMedia();
    }

    /**
     * Shows previous image in fullscreen view
     */
    function showPreviousImage() {
        currentFullscreenIndex = (currentFullscreenIndex - 1 + fullscreenImages.length) % fullscreenImages.length;
        showCurrentMedia();
    }

    /**
     * Handles key press events in fullscreen mode
     * @param {KeyboardEvent} e - Keyboard event
     */
    function handleFullscreenKeyPress(e) {
        if (e.key === 'Escape') {
            closeFullscreen();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.key === 'ArrowRight' ? showNextImage() : showPreviousImage();
        }
    }

    /**
     * Closes fullscreen view
     */
    function closeFullscreen() {
        if (fullscreenView) {
            // Unblock page scrolling
            console.log("Removing overflow: hidden from html and body");
            document.documentElement.style.removeProperty('overflow'); // For html
            document.body.style.removeProperty('overflow'); // For body
            
            // Remove event handlers
            document.removeEventListener('keydown', handleFullscreenKeyPress);
            
            // Remove swipe handlers
            if (fullscreenView.touchHandlers) {
                fullscreenView.removeEventListener('touchstart', fullscreenView.touchHandlers.start);
                fullscreenView.removeEventListener('touchmove', fullscreenView.touchHandlers.move);
                fullscreenView.removeEventListener('touchend', fullscreenView.touchHandlers.end);
            }
            
            fullscreenView.classList.remove('active');
            
            // Stop video when closing
            const iframe = fullscreenMedia.querySelector('iframe');
            if (iframe) {
                iframe.src = '';
            }

            // Remove element after animation
            setTimeout(() => {
                if (fullscreenView) {
                    fullscreenView.remove();
                    fullscreenView = null;
                    fullscreenMedia = null;
                }
            }, 300);
        }
    }

    // Back button handler (example)
    if (backButton) {
        console.log('backButton found');
        backButton.addEventListener('click', () => {
            console.log('backButton click');
            // Return logic
            window.location.href = '/'; // Example: if you need to go to main page
        });
    } else {
        console.error('backButton not found on this page');
    }

    // Add pageshow event handler for correct bfcache work
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            // If page restored from bfcache, call function to open menu
            openBurgerMenu();
        }
    });

    /**
     * Menu button click handler
     */
    if (menuBtn) {
        menuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (menuOverlay.classList.contains('visible')) {
                menuOverlay.classList.remove('visible');
                setTimeout(() => {
                    menuOverlay.style.display = "none";
                }, 400);
            } else {
                menuOverlay.style.display = "block";
                requestAnimationFrame(() => {
                    menuOverlay.classList.add('visible');
                });
            }
        });
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
});

// Test comment
