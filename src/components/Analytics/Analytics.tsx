import { useMemo, useState, useEffect } from 'react';
import { Fragrance } from '../../types/fragrance';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS, getChartColor } from '../../constants/colors';
import styles from './Analytics.module.scss';

interface AnalyticsProps {
  fragrances: Fragrance[];
  onClose: () => void;
}

const Analytics = ({ fragrances, onClose }: AnalyticsProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Aggregate data from all filtered fragrances
  const aggregatedData = useMemo(() => {
    const seasons: Record<string, number> = {};
    const occasions: Record<string, number> = {};
    const types: Record<string, number> = {};
    
    fragrances.forEach(fragrance => {
      // Aggregate seasons
      Object.entries(fragrance.seasons).forEach(([key, value]) => {
        seasons[key] = (seasons[key] || 0) + value;
      });
      
      // Aggregate occasions
      Object.entries(fragrance.occasions).forEach(([key, value]) => {
        occasions[key] = (occasions[key] || 0) + value;
      });
      
      // Aggregate types
      Object.entries(fragrance.types).forEach(([key, value]) => {
        types[key] = (types[key] || 0) + value;
      });
    });
    
    // Calculate averages (percentages)
    const count = fragrances.length || 1;
    
    const seasonsData = Object.entries(seasons)
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: Math.round(value / count)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    const occasionsData = Object.entries(occasions)
      .map(([key, value]) => ({
        name: key.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        value: Math.round(value / count)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    const typesData = Object.entries(types)
      .map(([key, value]) => ({
        name: key,
        value: Math.round(value / count)
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
    
    return { seasonsData, occasionsData, typesData };
  }, [fragrances]);

  const renderLegendList = (data: any[], category: keyof typeof CHART_COLORS) => {
    return (
      <div className={styles.legendList}>
        {data.map((entry, index) => (
          <div key={`legend-${index}`} className={styles.legendItem}>
            <span 
              className={styles.legendColor} 
              style={{ backgroundColor: getChartColor(category, entry.name) }}
            />
            <span className={styles.legendText}>{entry.name}</span>
            <span className={styles.legendValue}>{entry.value}%</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>×</button>
        
        <div className={styles.header}>
          <h2>Collection Analytics</h2>
          <p className={styles.subtitle}>
            Showing aggregated data from {fragrances.length} {fragrances.length === 1 ? 'fragrance' : 'fragrances'}
          </p>
        </div>

        <div className={styles.charts}>
          {/* Seasons Chart */}
          <div className={styles.chartSection}>
            <h4>Seasons</h4>
            {aggregatedData.seasonsData.length > 0 ? (
              <div className={styles.chartContainer}>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aggregatedData.seasonsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={isMobile ? 50 : 70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {aggregatedData.seasonsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor('seasons', entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {renderLegendList(aggregatedData.seasonsData, 'seasons')}
              </div>
            ) : (
              <p className={styles.noData}>No season data available</p>
            )}
          </div>

          {/* Occasions Chart */}
          <div className={styles.chartSection}>
            <h4>Occasions</h4>
            {aggregatedData.occasionsData.length > 0 ? (
              <div className={styles.chartContainer}>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aggregatedData.occasionsData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={isMobile ? 50 : 70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {aggregatedData.occasionsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor('occasions', entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {renderLegendList(aggregatedData.occasionsData, 'occasions')}
              </div>
            ) : (
              <p className={styles.noData}>No occasion data available</p>
            )}
          </div>

          {/* Types Chart */}
          <div className={styles.chartSection}>
            <h4>Fragrance Types</h4>
            {aggregatedData.typesData.length > 0 ? (
              <div className={styles.chartContainer}>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={aggregatedData.typesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={isMobile ? 50 : 70}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {aggregatedData.typesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getChartColor('types', entry.name)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {renderLegendList(aggregatedData.typesData, 'types')}
              </div>
            ) : (
              <p className={styles.noData}>No type data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
