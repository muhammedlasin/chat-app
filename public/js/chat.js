const socket = io()
const $messageForm = document.getElementById('form-message')
const $messageInput = $messageForm.querySelector('input')
const $messageButton = $messageForm.querySelector('button')
const $locationButton = document.getElementById('location')
const $showMessage = document.getElementById('messages')



//Template
const messageTemplate = document.getElementById('message-template').innerHTML
const locationTemplate = document.getElementById('location-template').innerHTML
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML

//Options

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {

    // new message element
    const $newMessage = $showMessage.lastElementChild

    //height of the new mesage
    const $newMessageStyles = getComputedStyle($newMessage)
    const $newMessageMargin = parseInt($newMessageStyles.marginBottom)
    const $newMessageHeight = $newMessage.offsetHeight + $newMessageMargin

    //visible height
    const visibleHeight = $showMessage.offsetHeight

    //height of message container

    const containerHeight = $showMessage.scrollHeight

    const scrollOffset = $showMessage.scrollTop + visibleHeight

    if (containerHeight - $newMessageHeight <= scrollOffset) {
        $showMessage.scrollTop = $showMessage.scrollHeight
    }

}

socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $showMessage.insertAdjacentHTML("beforeend", html);
    autoscroll()
})

socket.on('location', (location) => {
    const html = Mustache.render(locationTemplate, {
        username: location.username,
        location: location.url,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $showMessage.insertAdjacentHTML("beforeend", html);
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {

    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.getElementById('sidebar').innerHTML = html

})



$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    $messageButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, () => {
        $messageButton.removeAttribute('disabled')
        $messageInput.value = ''
        $messageInput.focus()
        console.log("message recieved")
    })

})


document.getElementById('location').addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('geo location not supported by browser')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {

            $locationButton.removeAttribute('disabled')
            console.log("location received")
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})