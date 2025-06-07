import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

interface Player {
  id: number;
  name: string;
  position: string;
  skill: number;
}

function createRandomPlayer(id: number): Player {
  const names = ['João', 'Pedro', 'Lucas', 'Mateus', 'Rafael'];
  const positions = ['Goleiro', 'Zagueiro', 'Meia', 'Atacante'];
  return {
    id,
    name: names[Math.floor(Math.random() * names.length)],
    position: positions[Math.floor(Math.random() * positions.length)],
    skill: Math.floor(Math.random() * 100) + 1,
  };
}

export default function SoccerManager() {
  const [players, setPlayers] = useState<Player[]>([
    createRandomPlayer(1),
    createRandomPlayer(2),
    createRandomPlayer(3),
  ]);
  const [funds, setFunds] = useState(1000);
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');

  const addPlayer = () => {
    if (!name || !position) return;
    const newPlayer: Player = {
      id: Date.now(),
      name,
      position,
      skill: Math.floor(Math.random() * 100) + 1,
    };
    setPlayers([...players, newPlayer]);
    setName('');
    setPosition('');
    setFunds(funds - 50); // custo de contratação
  };

  const removePlayer = (id: number) => {
    setPlayers(players.filter((p) => p.id !== id));
  };

  const playMatch = () => {
    const teamSkill = players.reduce((acc, p) => acc + p.skill, 0);
    const opponentSkill = Math.floor(Math.random() * (players.length * 100));
    if (teamSkill >= opponentSkill) {
      setFunds(funds + 100);
      alert('Você venceu a partida!');
    } else {
      setFunds(funds - 50);
      alert('Você perdeu a partida.');
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Gerenciador de Time de Futebol
      </Typography>
      <Typography variant="h6" gutterBottom>
        Caixa: {funds.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Elenco</Typography>
        <List>
          {players.map((player) => (
            <ListItem
              key={player.id}
              secondaryAction={
                <Button color="error" onClick={() => removePlayer(player.id)}>
                  Demitir
                </Button>
              }
            >
              <ListItemText
                primary={`${player.name} - ${player.position}`}
                secondary={`Habilidade: ${player.skill}`}
              />
            </ListItem>
          ))}
        </List>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <TextField
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Posição"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
          <Button variant="contained" onClick={addPlayer}>
            Contratar
          </Button>
        </Box>
      </Paper>

      <Button variant="contained" color="primary" onClick={playMatch}>
        Jogar Partida
      </Button>
    </Box>
  );
}
