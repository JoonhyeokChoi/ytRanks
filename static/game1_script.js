class Floppy {
    constructor() {
        this.block = document.getElementById("block");
        this.hole = document.getElementById("hole");
        this.character = document.getElementById("character");
        this.game = document.getElementById("game");
        this.jumping = 0;
        this.counter = 0;
        this.gameInterval;
        this.isAdrun = false;
        this.playButton = document.getElementById('playButton');
        this.rewardButton = document.getElementById('getReward');
        this.message = document.querySelector('.message');

        this.message.classList.add('messageStyle');
        this.rewardButton.disabled = true;

        this.block.style.animation = "none"; // Stop block animation
        this.hole.style.animation = "none";

        this.hole.addEventListener('animationiteration', () => {
            let random = -((Math.random()*300)+150);
            this.hole.style.top = random + "px";
            this.counter++;
        });

        window.addEventListener('load', () => {
            let gameplayData = JSON.parse(localStorage.getItem('gameplayData')) || { count: 0, lastDate: null };
            let { count, lastDate } = gameplayData;

            // Check if the user can play
            let currentDate = new Date().toDateString();
            if (lastDate === currentDate && count >= 3) {
                // Display message or perform action if the user cannot play
                // For example, disable the play button
                this.playButton.disabled = true;
                this.rewardButton.disabled = false;
                return;
            } else {
                this.playButton.disabled = false;
                this.rewardButton.disabled = true;
            }
        });

        this.playButton.addEventListener('click', () => {
            adBreak({
                type: 'next',  // ad shows at start of next level
                name: 'play-game',
                beforeAd: () => {
                    clearInterval(this.gameInterval);
                    console.log("beforeAd");
                    this.isAdrun = true;
                },
                afterAd: () => {
                    this.isAdrun = false;
                    this.startGame();
                }
            });
            this.startGame();
        });

        this.rewardButton.addEventListener('click', () => {
            adBreak({
                type: 'reward', 
                name: 'reward-game',
                beforeReward: (showAdFn)=>{
                    // Create a container for the buttons
                    let container = document.createElement('div');
                    container.style.textAlign = 'center';

                    let message = document.createElement('message');
                    message.innerHTML = "Do you want to watch ad? ";

                    // Create 'Yes' button
                    let yesButton = document.createElement('button');
                    yesButton.textContent = 'Yes';
                    yesButton.style.marginRight = '10px';
                    yesButton.addEventListener('click', () => {
                        showAdFn();
                        container.remove(); // Remove the button container after clicking 'Yes'
                    });

                    // Create 'No' button
                    let noButton = document.createElement('button');
                    noButton.textContent = 'No';
                    noButton.addEventListener('click', () => {
                        container.remove(); // Remove the button container after clicking 'No'
                    });

                    // Append buttons to the container
                    container.appendChild(message);
                    container.appendChild(yesButton);
                    container.appendChild(noButton);

                    // Display the prompt
                    let response = document.body.appendChild(container);
                },
                adDismissed: ()=>{
                    this.playButton.disabled = true;
                    this.rewardButton.disabled = false;
                },
                adViewed: ()=>{
                    localStorage.setItem('gameplayData', JSON.stringify({ count: 0, lastDate: new Date().toDateString() }));
                    this.buttonSet("play");
                }
            });
        });
    }

    startGame() {
        console.log("start game");
        // Check if there's any stored data
        let gameplayData = JSON.parse(localStorage.getItem('gameplayData')) || { count: 0, lastDate: null };
        let { count, lastDate } = gameplayData;

        // Check if the user can play
        let currentDate = new Date().toDateString();
        if (lastDate === currentDate && count >= 3) {
            alert("You've reached your limit for today. Please come back tomorrow!");
            return;
        }
        if (!this.isAdrun){
            clearInterval(this.gameInterval);
            // Reset the block and hole animations
            this.block.style.animation = "block 2s infinite linear";
            this.hole.style.animation = "block 2s infinite linear";
            this.message.innerHTML = '';
            this.message.classList.remove('messageStyle');
            // Reset the character position
            this.character.style.top = "300px";
            this.character.style.display = 'block';
            // Reset the counter
            this.counter = 0;
            // Start the game interval again
            this.gameInterval = setInterval(() => {
                let gameTop = this.game.getBoundingClientRect().top;
                let characterTop = parseInt(window.getComputedStyle(this.character).getPropertyValue("top"));
                if (this.jumping == 0) {
                    this.character.style.top = (characterTop+2)+"px";
                }
                var blockLeft = parseInt(window.getComputedStyle(this.block).getPropertyValue("left"));
                var holeTop = parseInt(window.getComputedStyle(this.hole).getPropertyValue("top"));
                var cTop = -((500+gameTop)-characterTop);
                if((characterTop>480+gameTop)||(characterTop<gameTop)||((blockLeft<20)&&(blockLeft>-50)&&((cTop<holeTop)||(cTop>holeTop+130)))){
                    clearInterval(this.gameInterval);
                    this.block.style.animation = "none"; // Stop block animation
                    this.hole.style.animation = "none";
                    this.message.innerHTML = 'Game Over'.fontcolor('red') + '<br>Score: ' + this.counter + '<br>Press Play To Restart';
                    this.message.classList.add('messageStyle');
                    this.character.style.display = 'none';
                    this.counter=0;

                    count++;
                    if (count >= 3) {
                        this.playButton.disabled = true;
                        this.rewardButton.disabled = false;
                    }
                    lastDate = currentDate;
                    localStorage.setItem('gameplayData', JSON.stringify({ count, lastDate }));
                }    
            }, 10);
        }   
    }

    showRewardPrompt(showAdFn) {
        // Create a container for the buttons
        let container = document.createElement('div');
        container.style.textAlign = 'center';

        let message = document.createElement('message');
        message.innerHTML = "Do you want to watch ad?";

        // Create 'Yes' button
        let yesButton = document.createElement('button');
        yesButton.textContent = 'Yes';
        yesButton.style.marginRight = '10px';
        yesButton.addEventListener('click', () => {
            showAdFn();
            container.remove(); // Remove the button container after clicking 'Yes'
        });

        // Create 'No' button
        let noButton = document.createElement('button');
        noButton.textContent = 'No';
        noButton.addEventListener('click', () => {
            container.remove(); // Remove the button container after clicking 'No'
        });

        // Append buttons to the container
        container.appendChild(message);
        container.appendChild(yesButton);
        container.appendChild(noButton);

        // Display the prompt
        let response = document.body.appendChild(container);
    }

    buttonSet(setting) {
        if (setting == "play") {
            this.playButton.disabled = false;
            this.rewardButton.disabled = true;
        } else {
            this.playButton.disabled = true;
            this.rewardButton.disabled = false;
        }
    }

    jump() {
        this.jumping = 1;
        let jumpCount = 0;
        let jumpInterval = setInterval(() => {
            let characterTop = parseInt(window.getComputedStyle(this.character).getPropertyValue("top"));
            if((characterTop>6) && (jumpCount < 15)){
                this.character.style.top = (characterTop-3)+"px";
            }        
            if(jumpCount > 20) {
                clearInterval(jumpInterval);
                this.jumping = 0;
                jumpCount = 0;
            }
            jumpCount++;
        }, 10);
    }
}

const floppy = new Floppy();
document.addEventListener('click', () => {
    floppy.jump();
});
// let block = document.getElementById("block");
// let hole = document.getElementById("hole");
// let character = document.getElementById("character");
// let game = document.getElementById("game");
// let jumping = 0;
// let counter = 0;
// let gameInterval;
// let isAdrun = false;
// let playButton = document.getElementById('playButton');
// let rewardButton = document.getElementById('getReward');
// let message = document.querySelector('.message');

// message.classList.add('messageStyle');
// rewardButton.disabled = true;

// block.style.animation = "none"; // Stop block animation
// hole.style.animation = "none";

// hole.addEventListener('animationiteration', () => {
//     let random = -((Math.random()*300)+150);
//     hole.style.top = random + "px";
//     counter++;
// });

// window.addEventListener('load', () => {
//     let gameplayData = JSON.parse(localStorage.getItem('gameplayData')) || { count: 0, lastDate: null };
//     let { count, lastDate } = gameplayData;

//     // Check if the user can play
//     let currentDate = new Date().toDateString();
//     if (lastDate === currentDate && count >= 3) {
//         // Display message or perform action if the user cannot play
//         // For example, disable the play button
//         playButton.disabled = true;
//         rewardButton.disabled = false;
//         return;
//     } else {
//         playButton.disabled = false;
//         rewardButton.disabled = true;
//     }
// });

// playButton.addEventListener('click', () => {
//     adBreak({
//         type: 'next',  // ad shows at start of next level
//         name: 'play-game',
//         beforeAd: () => {
//             clearInterval(gameInterval);
//             console.log("beforeAd");
//             isAdrun = true;
//         },
//         afterAd: () => {
//             isAdrun = false;
//             startGame();
//         }
//     });
//     startGame();
// });

// rewardButton.addEventListener('click', () => {
//     adBreak({
//         type: 'reward', 
//         name: 'reward-game',
//         beforeReward: (showAdFn)=>{
//             // Create a container for the buttons
//             let container = document.createElement('div');
//             container.style.textAlign = 'center';

//             let message = document.createElement('message');
//             message.innerHTML = "Do you want to watch ad? ";

//             // Create 'Yes' button
//             let yesButton = document.createElement('button');
//             yesButton.textContent = 'Yes';
//             yesButton.style.marginRight = '10px';
//             yesButton.addEventListener('click', () => {
//                 showAdFn();
//                 container.remove(); // Remove the button container after clicking 'Yes'
//             });

//             // Create 'No' button
//             let noButton = document.createElement('button');
//             noButton.textContent = 'No';
//             noButton.addEventListener('click', () => {
//                 container.remove(); // Remove the button container after clicking 'No'
//             });

//             // Append buttons to the container
//             container.appendChild(message);
//             container.appendChild(yesButton);
//             container.appendChild(noButton);

//             // Display the prompt
//             let response = document.body.appendChild(container);
//         },
//         adDismissed: ()=>{
//             playButton.disabled = true;
//             rewardButton.disabled = false;
//         },
//         adViewed: ()=>{
//             localStorage.setItem('gameplayData', JSON.stringify({ count: 0, lastDate: new Date().toDateString() }));
//             buttonSet("play");
//         }
//     });
// });

// function startGame() {
//     console.log("start game");
//     // Check if there's any stored data
//     let gameplayData = JSON.parse(localStorage.getItem('gameplayData')) || { count: 0, lastDate: null };
//     let { count, lastDate } = gameplayData;

//     // Check if the user can play
//     let currentDate = new Date().toDateString();
//     if (lastDate === currentDate && count >= 3) {
//         alert("You've reached your limit for today. Please come back tomorrow!");
//         return;
//     }
//     if (!isAdrun){
//         clearInterval(gameInterval);
//         // Reset the block and hole animations
//         block.style.animation = "block 2s infinite linear";
//         hole.style.animation = "block 2s infinite linear";
//         message.innerHTML = '';
//         message.classList.remove('messageStyle');
//         // Reset the character position
//         character.style.top = "300px";
//         character.style.display = 'block';
//         // Reset the counter
//         counter = 0;
//         // Start the game interval again
//         gameInterval = setInterval(function() {
//             let gameTop = game.getBoundingClientRect().top;
//             let characterTop = 
//             parseInt(window.getComputedStyle(character).getPropertyValue("top"));
//             if (jumping == 0) {
//                 character.style.top = (characterTop+2)+"px";
//             }
//             var blockLeft = parseInt(window.getComputedStyle(block).getPropertyValue("left"));
//             var holeTop = parseInt(window.getComputedStyle(hole).getPropertyValue("top"));
//             var cTop = -((500+gameTop)-characterTop);
//             if((characterTop>480+gameTop)||(characterTop<gameTop)||((blockLeft<20)&&(blockLeft>-50)&&((cTop<holeTop)||(cTop>holeTop+130)))){
//                 clearInterval(gameInterval);
//                 block.style.animation = "none"; // Stop block animation
//                 hole.style.animation = "none";
//                 message.innerHTML = 'Game Over'.fontcolor('red') + '<br>Score: ' + counter + '<br>Press Play To Restart';
//                 message.classList.add('messageStyle');
//                 character.style.display = 'none';
//                 counter=0;
                
//                 count++;
//                 if (count >= 3) {
//                     playButton.disabled = true;
//                     rewardButton.disabled = false;
//                 }
//                 lastDate = currentDate;
//                 localStorage.setItem('gameplayData', JSON.stringify({ count, lastDate }));
//             }    
//         }, 10);
//     }   
// }

// function showRewardPrompt(showAdFn) {
//     // Create a container for the buttons
//     let container = document.createElement('div');
//     container.style.textAlign = 'center';

//     let message = document.createElement('message');
//     message.innerHTML = "Do you want to watch ad?";

//     // Create 'Yes' button
//     let yesButton = document.createElement('button');
//     yesButton.textContent = 'Yes';
//     yesButton.style.marginRight = '10px';
//     yesButton.addEventListener('click', () => {
//         showAdFn();
//         container.remove(); // Remove the button container after clicking 'Yes'
//     });

//     // Create 'No' button
//     let noButton = document.createElement('button');
//     noButton.textContent = 'No';
//     noButton.addEventListener('click', () => {
//         container.remove(); // Remove the button container after clicking 'No'
//     });

//     // Append buttons to the container
//     container.appendChild(message);
//     container.appendChild(yesButton);
//     container.appendChild(noButton);

//     // Display the prompt
//     let response = document.body.appendChild(container);
// }

// function buttonSet(setting) {
//     if (setting == "play") {
//         playButton.disabled = false;
//         rewardButton.disabled = true;
//     } else {
//         playButton.disabled = true;
//         rewardButton.disabled = false;
//     }
// }

// function jump() {
//     jumping = 1;
//     let jumpCount = 0;
//     let jumpInterval = setInterval(function() {
//         let characterTop = 
//         parseInt(window.getComputedStyle(character).getPropertyValue("top"));
//         if((characterTop>6) && (jumpCount < 15)){
//             character.style.top = (characterTop-3)+"px";
//         }        
//         if(jumpCount > 20) {
//             clearInterval(jumpInterval);
//             jumping = 0;
//             jumpCount = 0;
//         }
//         jumpCount++;
//     }, 10);
// }