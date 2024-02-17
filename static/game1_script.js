let block = document.getElementById("block");
let hole = document.getElementById("hole");
let character = document.getElementById("character");
let game = document.getElementById("game");
let jumping = 0;
let counter = 0;
let gameInterval;
let playButton = document.getElementById('playButton');
let message = document.querySelector('.message');

message.classList.add('messageStyle');

block.style.animation = "none"; // Stop block animation
hole.style.animation = "none";

hole.addEventListener('animationiteration', () => {
    let random = -((Math.random()*300)+150);
    hole.style.top = random + "px";
    counter++;
});

playButton.addEventListener('click', () => {
    clearInterval(gameInterval);
    // Reset the block and hole animations
    block.style.animation = "block 2s infinite linear";
    hole.style.animation = "block 2s infinite linear";
    message.innerHTML = '';
    message.classList.remove('messageStyle');
    // Reset the character position
    character.style.top = "300px";
    character.style.display = 'block';
    // Reset the counter
    counter = 0;
    // Start the game interval again
    gameInterval = setInterval(function() {
        let gameTop = game.getBoundingClientRect().top;
        let characterTop = 
        parseInt(window.getComputedStyle(character).getPropertyValue("top"));
        if (jumping == 0) {
            character.style.top = (characterTop+2)+"px";
        }
        var blockLeft = parseInt(window.getComputedStyle(block).getPropertyValue("left"));
        var holeTop = parseInt(window.getComputedStyle(hole).getPropertyValue("top"));
        var cTop = -((500+gameTop)-characterTop);
        if((characterTop>480+gameTop)||(characterTop<gameTop)||((blockLeft<20)&&(blockLeft>-50)&&((cTop<holeTop)||(cTop>holeTop+130)))){
            clearInterval(gameInterval);
            block.style.animation = "none"; // Stop block animation
            hole.style.animation = "none";
            message.innerHTML = 'Game Over'.fontcolor('red') + '<br>Score: ' + counter + '<br>Press Play To Restart';
            message.classList.add('messageStyle');
            character.style.display = 'none';
            counter=0;
        }    
    }, 10);
});

function jump() {
    jumping = 1;
    let jumpCount = 0;
    let jumpInterval = setInterval(function() {
        let characterTop = 
        parseInt(window.getComputedStyle(character).getPropertyValue("top"));
        if((characterTop>6) && (jumpCount < 15)){
            character.style.top = (characterTop-3)+"px";
        }        
        if(jumpCount > 20) {
            clearInterval(jumpInterval);
            jumping = 0;
            jumpCount = 0;
        }
        jumpCount++;
    }, 10);
}