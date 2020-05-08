const form = document.getElementById("registration")

form.addEventListener("submit", event => {
    event.preventDefault()
    form.style.display = "none"
    startCall()
})

const startCall = () => {
    fetch('http://localhost:9000/session', { 
        method: "POST",
        body: JSON.stringify({ name: form.elements.name.value })
    }).then(res => {
        return res.json();
    }).then(res => {
        const { apiKey, sessionId, token } = res;
        initializeSession(apiKey, sessionId, token);
    }).catch(handleCallback);
}

function initializeSession(apiKey, sessionId, token) {
    const session = OT.initSession(apiKey, sessionId);
    const publisher = OT.initPublisher(
        "publisher",
        { insertMode: "append", width: "100%", height: "100%" },
        handleCallback
    );
 
    session.connect(token, error => {
        if (error) {
            handleCallback(error);
        } else {
            session.publish(publisher, handleCallback);
        }
    });
 
    session.on("streamCreated", event => {
        session.subscribe(
            event.stream,
            "subscriber",
            { insertMode: "append", width: "100%", height: "100%" },
            handleCallback
        );
  });
}

function handleCallback(error) {
    if (error) {
        console.log("error: " + error.message);
    } else {
        console.log("callback success");
    }
}
