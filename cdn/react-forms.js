const metadata = {
    type: 'custom',
    customText: 'dave@acme.com June 14, 2022 3:52PM PST',
    transparency: '0.9',
    size: '16px',
};

const previewCanvas = document.createElement('canvas');

function createWatermarkingOverlay({ width, height, text, textSize, transparency, canvas, ctx }) {
    if (!canvas) {
        canvas = previewCanvas;
    }
    canvas.width = width;
    canvas.height = height;

    if (!ctx) {
        ctx = canvas.getContext('2d');
    }
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate((Math.PI / 180) * 315); // 45 degrees counter clockwise
    ctx.globalAlpha = +transparency;
    ctx.font = `${textSize} Lato`;
    ctx.fillStyle = '#4E4E4E';

    if (text) {
        const textDelimeter = '    ';
        while (text.length < (width + height) / 1) {
            // repeat the text so it covers the whole screen
            text += textDelimeter + text;
        }

        const lineHeight = parseInt(textSize, 10) * 2.5;

        for (let pos = -(height + width) * 2; pos <= (height + width) / 2; pos += lineHeight) {
            const iteration = pos / lineHeight;
            const shufflePos = (iteration * 20) % text.length;
            // shift where the text starts by 20 symbols per iteration so that position of beginning of text varies on screen
            const shuffledText = text.slice(shufflePos) + textDelimeter + text;

            ctx.fillText(shuffledText, pos - (height + width) / 2, pos);
        }
    }

    ctx.restore();
    return canvas.toDataURL();
}

// eslint-disable-next-line no-unused-vars
async function addReactForms(container) {
    let mediaContainerEl;
    let watermark;
    let isStyleObserverPaused = false;
    let overlay;

    function setStyles(node, styles) {
        Object.entries(styles).forEach(([property, value]) => {
            node.style.setProperty(property, value, 'important');
        });
    }

    function setWatermarkProps(watermarkNode) {
        watermarkNode.classList.add('watermark');
        watermarkNode.innerHTML = `<img src="${overlay}" />`;

        const containerStyles = {
            position: 'absolute',
            width: '100%',
            height: '100%',
            left: '0',
            top: '0',
            'pointer-events': 'none',
            overflow: 'hidden',
        };
        setStyles(watermarkNode, containerStyles);

        const imageNode = watermarkNode.querySelector('img');
        const imageStyles = {
            // width: '100vw',
            width: `${window.screen.availWidth}px`,
            // height: '100vh',
        };
        setStyles(imageNode, imageStyles);
    }

    function onWatermarkMutation(mutations) {
        if (isStyleObserverPaused) return;
        mutations.forEach(({ target }) => {
            let watermarkNode = target;
            if (watermarkNode !== watermark) {
                while (!watermarkNode.classList?.contains('watermark')) {
                    watermarkNode = watermarkNode.parentNode;
                }
            }
            // const watermarkNode = target.nodeType === Node.TEXT_NODE ? target.parentNode : target;
            // if (watermarkNode) {
            //     watermarkNode.parentNode.removeChild(watermarkNode);
            // }
            isStyleObserverPaused = true;
            setWatermarkProps(watermarkNode);
            setTimeout(() => {
                isStyleObserverPaused = false;
            });
        });
    }

    function addWatermark() {
        watermark = mediaContainerEl.appendChild(document.createElement('div'));
        setWatermarkProps(watermark);
        console.log('watermark', watermark); // eslint-disable-line no-console

        const observerOptions = {
            attributes: true,
            attributeFilter: ['class', 'style'],
            childList: true,
            characterData: true,
            subtree: true,
        };

        const styleObserver = new MutationObserver(onWatermarkMutation);
        styleObserver.observe(watermark, observerOptions);
    }

    function onWatermarkRemove(mutations) {
        mutations.forEach(mutation => {
            mutation.removedNodes.forEach(node => {
                if (node.classList.contains('watermark')) {
                    addWatermark();
                }
            });
        });
    }

    mediaContainerEl = container;
    overlay = createWatermarkingOverlay({
        // width: document.body.clientWidth,
        // height: document.body.clientHeight,
        width: window.screen.availWidth,
        height: window.screen.availHeight,
        text: metadata.customText,
        textSize: metadata.size,
        transparency: metadata.transparency,
    });

    // while (!(userName = localStorage.getItem('username'))) {
    //     await new Promise(resolve => setTimeout(resolve, 500));
    // }

    const removalObserver = new MutationObserver(onWatermarkRemove);
    const removalObserverOptions = {
        childList: true,
    };
    removalObserver.observe(mediaContainerEl, removalObserverOptions);

    addWatermark();
}
