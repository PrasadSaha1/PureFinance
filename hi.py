import random 

numGames = 0
numWins = 0

for i in range(1000000):
    localWins = 0
    localLosses = 0
    numGames += 1
    while True:
        win = random.randint(1, 2)

        if win == 1:
            localWins += 1
        else:
            localLosses += 1

        if localLosses == 3:
            break
        if localWins == 15:
            numWins += 1
            break
    
print((numWins / numGames) ** -1)

