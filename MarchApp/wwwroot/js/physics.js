export function startLoop(dotNetRef, canvasId, obstacles) {
    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    const imageCache = {};
    function getImage(url) {
        if (!imageCache[url]) {
            const img = new Image();
            img.src = url;
            imageCache[url] = img;
        }
        return imageCache[url];
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        dotNetRef.invokeMethodAsync('SetBounds', canvas.width, canvas.height);
        updateSceneObstacles();
    }

    function updateSceneObstacles() {
        const canvasRect = canvas.getBoundingClientRect();

        // Portraits are circular (border-radius: 50%) — measure as circles
        const portraitEls = document.querySelectorAll('.scene .portrait');
        const circles = Array.from(portraitEls).map(el => {
            const r = el.getBoundingClientRect();
            return {
                centerX: (r.left - canvasRect.left) + r.width / 2,
                centerY: (r.top - canvasRect.top) + r.height / 2,
                radius: r.width / 2 // assumes width === height (square element, round via CSS)
            };
        });

        // Card stays rectangular
        const cardEls = document.querySelectorAll('.scene .card');
        const rects = Array.from(cardEls).map(el => {
            const r = el.getBoundingClientRect();
            return {
                x: r.left - canvasRect.left,
                y: r.top - canvasRect.top,
                width: r.width,
                height: r.height
            };
        });

        dotNetRef.invokeMethodAsync('SetSceneObstacles', rects, circles);
    }

    resize();
    window.addEventListener('resize', resize);

    function frame() {
        dotNetRef.invokeMethodAsync('Tick').then(balls => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const b of balls) {
                const img = getImage(b.image);
                const size = b.radius * 2;

                if (img.complete && img.naturalWidth > 0) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.drawImage(img, b.x - b.radius, b.y - b.radius, size, size);
                    ctx.restore();
                } else {
                    ctx.beginPath();
                    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                    ctx.fillStyle = 'gray';
                    ctx.fill();
                }
            }
        });
        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}