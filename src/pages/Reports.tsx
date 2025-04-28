import { useState, useEffect } from 'react';
import { Typography, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { supabase } from '../lib/supabase';

interface BudgetSummary {
  id: string;
  title: string;
  total_value: number;
  bdi: number;
  created_at: string;
  chapter_count: number;
  service_count: number;
}

export default function Reports() {
  const [summaries, setSummaries] = useState<BudgetSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummaries();
  }, []);

  const loadSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          chapters:chapters(
            count,
            services:services(count)
          )
        `);

      if (error) throw error;

      const summaries = data.map(budget => ({
        ...budget,
        chapter_count: budget.chapters[0].count,
        service_count: budget.chapters.reduce((total: number, chapter: any) => 
          total + (chapter.services?.[0]?.count || 0), 0)
      }));

      setSummaries(summaries);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Relatórios
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resumo dos Orçamentos
        </Typography>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell align="right">Valor Total</TableCell>
                  <TableCell align="right">BDI (%)</TableCell>
                  <TableCell align="right">Capítulos</TableCell>
                  <TableCell align="right">Serviços</TableCell>
                  <TableCell>Data de Criação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaries.map((summary) => (
                  <TableRow key={summary.id}>
                    <TableCell>{summary.title}</TableCell>
                    <TableCell align="right">
                      {summary.total_value.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      })}
                    </TableCell>
                    <TableCell align="right">{summary.bdi}%</TableCell>
                    <TableCell align="right">{summary.chapter_count}</TableCell>
                    <TableCell align="right">{summary.service_count}</TableCell>
                    <TableCell>
                      {new Date(summary.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
}