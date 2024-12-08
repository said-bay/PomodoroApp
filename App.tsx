/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  TextInput,
  Modal,
  ScrollView,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pomodoro geçmişi için tip tanımı
type PomodoroRecord = {
  id: number;
  duration: number;
  date: Date;
  completed: boolean;
  note?: string; // İsteğe bağlı not alanı
};

// Tema renkleri
const themes = {
  dark: {
    background: '#000000',
    text: '#FFFFFF',
    textSecondary: '#999999',
    border: '#333333',
    buttonBg: '#1A1A1A',
    dangerButton: '#FF3B30',
    menuBg: '#1A1A1A',
    divider: '#333333',
    finishedBg: '#FFFFFF',
    finishedText: '#000000',
  },
  light: {
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E5E5E5',
    buttonBg: '#F5F5F5',
    dangerButton: '#FF3B30',
    menuBg: '#F5F5F5',
    divider: '#E5E5E5',
    finishedBg: '#000000',
    finishedText: '#FFFFFF',
  },
};

const App = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isEditing, setIsEditing] = useState(false);
  const [inputMinutes, setInputMinutes] = useState('25');
  const [showMenu, setShowMenu] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('timer');
  const [pomodoroHistory, setPomodoroHistory] = useState<PomodoroRecord[]>([]);
  const [isPortrait, setIsPortrait] = useState(Dimensions.get('window').height > Dimensions.get('window').width);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showColon, setShowColon] = useState(true);
  const [showFinished, setShowFinished] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [isClockOnlyMode, setIsClockOnlyMode] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  const theme = isDarkTheme ? themes.dark : themes.light;

  // Geçmişi yükle
  useEffect(() => {
    loadHistory();
  }, []);

  // Geçmiş değiştiğinde kaydet
  useEffect(() => {
    saveHistory();
  }, [pomodoroHistory]);

  // Tema tercihini yükle
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Saat modu tercihini yükle
  useEffect(() => {
    loadClockOnlyModePreference();
  }, []);

  // Tema tercihini kaydet
  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themePreference');
      if (savedTheme !== null) {
        setIsDarkTheme(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Tema tercihi yüklenirken hata:', error);
    }
  };

  // Saat modu tercihini kaydet
  const loadClockOnlyModePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('clockOnlyMode');
      if (savedMode !== null) {
        setIsClockOnlyMode(savedMode === 'true');
      }
    } catch (error) {
      console.error('Saat modu tercihi yüklenirken hata:', error);
    }
  };

  // Tema değiştirme fonksiyonu
  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);
    try {
      await AsyncStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Tema tercihi kaydedilirken hata:', error);
    }
  };

  // Saat modunu değiştirme fonksiyonu
  const toggleClockOnlyMode = async () => {
    const newMode = !isClockOnlyMode;
    setIsClockOnlyMode(newMode);
    try {
      await AsyncStorage.setItem('clockOnlyMode', newMode.toString());
    } catch (error) {
      console.error('Saat modu tercihi kaydedilirken hata:', error);
    }
  };

  // Geçmişi AsyncStorage'dan yükle
  const loadHistory = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('pomodoroHistory');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        // Tarihleri string'den Date objesine çevir
        const historyWithDates = parsedHistory.map((record: PomodoroRecord) => ({
          ...record,
          date: new Date(record.date)
        }));
        setPomodoroHistory(historyWithDates);
      }
    } catch (error) {
      console.error('Geçmiş yüklenirken hata:', error);
    }
  };

  // Geçmişi AsyncStorage'a kaydet
  const saveHistory = async () => {
    try {
      await AsyncStorage.setItem('pomodoroHistory', JSON.stringify(pomodoroHistory));
    } catch (error) {
      console.error('Geçmiş kaydedilirken hata:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      // Süre bittiğinde yeni bir pomodoro başlat
      const newRecord: PomodoroRecord = {
        id: Date.now(),
        duration: parseInt(inputMinutes, 10),
        date: new Date(),
        completed: true,
      };
      setPomodoroHistory(prev => [newRecord, ...prev]);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, inputMinutes]);

  useEffect(() => {
    const updateOrientation = () => {
      setIsPortrait(Dimensions.get('window').height > Dimensions.get('window').width);
    };

    Dimensions.addEventListener('change', updateOrientation);
    return () => {
      // @ts-ignore
      Dimensions.removeEventListener('change', updateOrientation);
    };
  }, []);

  // Saat güncellemesi için useEffect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const blinkTimer = setInterval(() => {
      setShowColon(prev => !prev);
    }, 1000);

    return () => {
      clearInterval(timer);
      clearInterval(blinkTimer);
    };
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !showFinished) {
      setShowFinished(true);
      fadeAnim.setValue(1);
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setShowFinished(false);
          setTimeLeft(parseInt(inputMinutes, 10) * 60);
        });
      }, 1500);
    }
  }, [timeLeft, inputMinutes]);

  const dynamicStyles = StyleSheet.create({
    timerContainer: {
      position: 'absolute',
      top: isPortrait ? '35%' : '9%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    timerText: {
      color: theme.text,
      fontSize: isPortrait ? 161 : 218,
      fontWeight: Platform.select({
        ios: '100',
        android: '100',
      }),
      fontFamily: Platform.select({
        ios: 'Helvetica Neue',
        android: 'sans-serif-thin',
      }),
      opacity: 0.65,
      includeFontPadding: false,
      letterSpacing: 4,
      textShadowColor: `${theme.text}10`,
      textShadowOffset: {width: 0, height: 0},
      textShadowRadius: 10,
    },
    startButton: {
      position: 'absolute',
      bottom: isPortrait ? 150 : 30,
      paddingHorizontal: 40,
      paddingVertical: 15,
      borderRadius: 30,
      borderWidth: 1,
      borderColor: theme.text,
      backgroundColor: theme.buttonBg,
    },
  });

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimerPress = () => {
    if (!isRunning) {
      setIsEditing(true);
      setInputMinutes(Math.floor(timeLeft / 60).toString());
    }
  };

  const handleInputSubmit = () => {
    const newMinutes = parseInt(inputMinutes, 10);
    if (newMinutes > 0 && newMinutes <= 180) {
      setTimeLeft(newMinutes * 60);
      setIsEditing(false);
    }
  };

  const toggleTimer = () => {
    if (!isRunning) {
      // Başlatırken mevcut süreyi kullan
      setIsRunning(true);
    } else {
      // Durdurulduğunda
      setIsRunning(false);
      
      // Geçmişe ekle
      const totalSeconds = parseInt(inputMinutes, 10) * 60;
      const elapsedSeconds = totalSeconds - timeLeft;
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      
      const newRecord: PomodoroRecord = {
        id: Date.now(),
        duration: parseInt(inputMinutes, 10),
        date: new Date(),
        completed: timeLeft === 0,
        note: timeLeft > 0 ? `${elapsedMinutes} dk çalışıldı` : undefined
      };
      setPomodoroHistory(prev => [newRecord, ...prev]);
      
      // Süreyi sıfırla
      setTimeLeft(parseInt(inputMinutes, 10) * 60);
    }
    
    if (isEditing) {
      handleInputSubmit();
    }
  };

  const handleMenuPress = () => {
    setShowMenu(true);
  };

  const handleMenuOption = (screen: string) => {
    setShowMenu(false);
    setCurrentScreen(screen);
  };

  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Bugün';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Dün';
    }
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
    });
  };

  const handleDeleteHistory = async () => {
    try {
      await AsyncStorage.removeItem('pomodoroHistory');
      setPomodoroHistory([]);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Geçmiş silinirken hata:', error);
    }
  };

  // İstatistik hesaplama fonksiyonları
  const calculateStats = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());

    const todayRecords = pomodoroHistory.filter(record => 
      new Date(record.date).getTime() >= today.getTime()
    );

    const weekRecords = pomodoroHistory.filter(record => 
      new Date(record.date).getTime() >= weekAgo.getTime()
    );

    const monthRecords = pomodoroHistory.filter(record => 
      new Date(record.date).getTime() >= monthAgo.getTime()
    );

    return {
      today: {
        total: todayRecords.length,
        completed: todayRecords.filter(r => r.completed).length,
        totalMinutes: todayRecords.reduce((acc, r) => acc + (r.completed ? r.duration : 0), 0),
      },
      week: {
        total: weekRecords.length,
        completed: weekRecords.filter(r => r.completed).length,
        totalMinutes: weekRecords.reduce((acc, r) => acc + (r.completed ? r.duration : 0), 0),
      },
      month: {
        total: monthRecords.length,
        completed: monthRecords.filter(r => r.completed).length,
        totalMinutes: monthRecords.reduce((acc, r) => acc + (r.completed ? r.duration : 0), 0),
      },
      all: {
        total: pomodoroHistory.length,
        completed: pomodoroHistory.filter(r => r.completed).length,
        totalMinutes: pomodoroHistory.reduce((acc, r) => acc + (r.completed ? r.duration : 0), 0),
      }
    };
  };

  // En verimli saatleri hesapla
  const calculateMostProductiveHours = () => {
    const hourCounts = new Array(24).fill(0);
    pomodoroHistory
      .filter(r => r.completed)
      .forEach(record => {
        const hour = new Date(record.date).getHours();
        hourCounts[hour]++;
      });
    
    const maxCount = Math.max(...hourCounts);
    const productiveHours = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count > maxCount * 0.7) // En yüksek değerin %70'inden fazla olanlar
      .sort((a, b) => b.count - a.count)
      .map(({ hour }) => hour);

    return productiveHours;
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'history':
        return (
          <View style={styles.screenContainer}>
            <Text style={[styles.historyTitle, {color: theme.text}]}>Pomodoro Geçmişi</Text>
            <ScrollView style={styles.historyList}>
              {/* Tarihleri grupla */}
              {Array.from(new Set(pomodoroHistory.map(record => 
                formatDate(new Date(record.date))
              ))).map(dateGroup => (
                <View key={dateGroup} style={[styles.dateSection, {borderTopColor: theme.border}]}>
                  <Text style={[styles.dateSectionTitle, {
                    color: theme.textSecondary,
                    borderBottomColor: theme.border
                  }]}>{dateGroup}</Text>
                  {pomodoroHistory
                    .filter(record => formatDate(new Date(record.date)) === dateGroup)
                    .map((record) => (
                    <View key={record.id}>
                      <View style={styles.historyItem}>
                        <View style={styles.itemLeft}>
                          <View style={styles.timeContainer}>
                            <Text style={[styles.statusIcon, 
                              record.completed ? styles.completedIcon : styles.failedIcon]}>
                              {record.completed ? '✓' : '×'}
                            </Text>
                            <Text style={[styles.timeText, {color: theme.text}]}>
                              {new Date(record.date).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </Text>
                          </View>
                          {record.note && (
                            <Text style={[styles.statusNote, {color: theme.textSecondary}]}>{record.note}</Text>
                          )}
                        </View>
                        <Text style={[styles.durationText, {color: theme.text}]}>{record.duration} dakika</Text>
                      </View>
                      <View style={[styles.separator, {backgroundColor: theme.border}]} />
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        );
      case 'settings':
        return (
          <View style={styles.screenContainer}>
            <Text style={[styles.historyTitle, {color: theme.text}]}>Ayarlar</Text>
            <View style={styles.settingsContainer}>
              <TouchableOpacity
                style={[styles.settingItem, {borderBottomColor: theme.border}]}
                onPress={toggleTheme}>
                <Text style={[styles.settingLabel, {color: theme.text}]}>Tema</Text>
                <Text style={[styles.settingValue, {color: theme.textSecondary}]}>
                  {isDarkTheme ? 'Koyu' : 'Açık'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.settingItem, {borderBottomColor: theme.border}]}
                onPress={toggleClockOnlyMode}>
                <Text style={[styles.settingLabel, {color: theme.text}]}>Sadece Saat Modu</Text>
                <Text style={[styles.settingValue, {color: theme.textSecondary}]}>
                  {isClockOnlyMode ? 'Açık' : 'Kapalı'}
                </Text>
              </TouchableOpacity>
              <View style={[styles.settingItem, {borderBottomColor: theme.border}]}>
                <Text style={[styles.settingLabel, {color: theme.text}]}>Sürüm</Text>
                <Text style={[styles.settingValue, {color: theme.textSecondary}]}>1.0.0</Text>
              </View>
              <TouchableOpacity
                style={[styles.settingItem, styles.dangerButton, {backgroundColor: `${theme.dangerButton}20`}]}
                onPress={() => setShowDeleteConfirm(true)}>
                <Text style={styles.dangerButtonText}>Geçmişi Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 'stats':
        const stats = calculateStats();
        const productiveHours = calculateMostProductiveHours();
        return (
          <View style={styles.screenContainer}>
            <Text style={[styles.historyTitle, {color: theme.text}]}>İstatistikler</Text>
            <ScrollView style={styles.statsContainer}>
              {/* Bugün */}
              <View style={[styles.statsSection, {borderBottomColor: theme.border}]}>
                <Text style={[styles.statsSectionTitle, {color: theme.text}]}>Bugün</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.text}]}>{stats.today.completed}</Text>
                    <Text style={[styles.statLabel, {color: theme.textSecondary}]}>Tamamlanan</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.text}]}>
                      {Math.round((stats.today.completed / stats.today.total) * 100 || 0)}%
                    </Text>
                    <Text style={[styles.statLabel, {color: theme.textSecondary}]}>Başarı</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.text}]}>{stats.today.totalMinutes}</Text>
                    <Text style={[styles.statLabel, {color: theme.textSecondary}]}>Dakika</Text>
                  </View>
                </View>
              </View>

              {/* Bu Hafta */}
              <View style={[styles.statsSection, {borderBottomColor: theme.border}]}>
                <Text style={[styles.statsSectionTitle, {color: theme.text}]}>Bu Hafta</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.text}]}>{stats.week.completed}</Text>
                    <Text style={[styles.statLabel, {color: theme.textSecondary}]}>Tamamlanan</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.text}]}>
                      {Math.round((stats.week.completed / stats.week.total) * 100 || 0)}%
                    </Text>
                    <Text style={[styles.statLabel, {color: theme.textSecondary}]}>Başarı</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.text}]}>{Math.round(stats.week.totalMinutes / 60)}</Text>
                    <Text style={[styles.statLabel, {color: theme.textSecondary}]}>Saat</Text>
                  </View>
                </View>
              </View>

              {/* Bu Ay */}
              <View style={[styles.statsSection, {borderBottomColor: theme.border}]}>
                <Text style={[styles.statsSectionTitle, {color: theme.text}]}>Bu Ay</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.text}]}>{stats.month.completed}</Text>
                    <Text style={[styles.statLabel, {color: theme.textSecondary}]}>Tamamlanan</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.text}]}>
                      {Math.round((stats.month.completed / stats.month.total) * 100 || 0)}%
                    </Text>
                    <Text style={[styles.statLabel, {color: theme.textSecondary}]}>Başarı</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.text}]}>{Math.round(stats.month.totalMinutes / 60)}</Text>
                    <Text style={[styles.statLabel, {color: theme.textSecondary}]}>Saat</Text>
                  </View>
                </View>
              </View>

              {/* En Verimli Saatler */}
              <View style={[styles.statsSection, {borderBottomColor: theme.border}]}>
                <Text style={[styles.statsSectionTitle, {color: theme.text}]}>En Verimli Saatler</Text>
                <View style={styles.productiveHoursContainer}>
                  {productiveHours.map(hour => (
                    <View key={hour} style={[styles.hourBadge, {backgroundColor: theme.buttonBg}]}>
                      <Text style={[styles.hourText, {color: theme.text}]}>
                        {`${hour.toString().padStart(2, '0')}:00`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Toplam İstatistikler */}
              <View style={styles.statsSection}>
                <Text style={[styles.statsSectionTitle, {color: theme.text}]}>Toplam</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.text}]}>{stats.all.completed}</Text>
                    <Text style={[styles.statLabel, {color: theme.textSecondary}]}>Pomodoro</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.text}]}>
                      {Math.round((stats.all.completed / stats.all.total) * 100 || 0)}%
                    </Text>
                    <Text style={[styles.statLabel, {color: theme.textSecondary}]}>Başarı</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: theme.text}]}>{Math.round(stats.all.totalMinutes / 60)}</Text>
                    <Text style={[styles.statLabel, {color: theme.textSecondary}]}>Saat</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        );
      default:
        return (
          <>
            <View style={dynamicStyles.timerContainer}>
              {!isPortrait && (
                <View style={styles.clockContainer}>
                  <Text style={[styles.currentTimeText, {color: theme.text}]}>
                    {currentTime.getHours().toString().padStart(2, '0')}
                  </Text>
                  <Text style={[styles.currentTimeText, { opacity: showColon ? 0.5 : 0, color: theme.text }]}>:</Text>
                  <Text style={[styles.currentTimeText, {color: theme.text}]}>
                    {currentTime.getMinutes().toString().padStart(2, '0')}
                  </Text>
                </View>
              )}
              <TouchableOpacity onPress={handleTimerPress}>
                {isEditing ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      style={dynamicStyles.timerText}
                      keyboardType="number-pad"
                      value={inputMinutes}
                      onChangeText={setInputMinutes}
                      onBlur={handleInputSubmit}
                      onSubmitEditing={handleInputSubmit}
                      maxLength={3}
                      autoFocus
                      selectTextOnFocus
                    />
                    <Text style={styles.minuteText}>dakika</Text>
                  </View>
                ) : (
                  <Text style={dynamicStyles.timerText}>{formatTime(timeLeft)}</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={dynamicStyles.startButton}
              onPress={toggleTimer}>
              <Text style={[styles.buttonText, {color: theme.text}]}>{isRunning ? 'Durdur' : 'Başlat'}</Text>
            </TouchableOpacity>
          </>
        );
    }
  };

  // Saat ekranını render et
  const renderClockOnlyMode = () => (
    <View style={[styles.clockOnlyContainer, {backgroundColor: theme.background}]}>
      <StatusBar hidden={true} />
      <View style={[styles.clockOnlyContent]}>
        <Text style={[styles.clockOnlyText, {
          color: theme.text,
          fontSize: isPortrait ? 156 : 256,
        }]}>
          {currentTime.getHours().toString().padStart(2, '0')}
        </Text>
        <Text style={[styles.clockOnlyText, {
          color: theme.text,
          opacity: showColon ? 1 : 0,
          fontSize: isPortrait ? 156 : 256,
        }]}>:</Text>
        <Text style={[styles.clockOnlyText, {
          color: theme.text,
          fontSize: isPortrait ? 156 : 256,
        }]}>
          {currentTime.getMinutes().toString().padStart(2, '0')}
        </Text>
      </View>
      <TouchableOpacity 
        style={[styles.clockOnlyExitButton, {
          bottom: isPortrait ? 40 : 20,
        }]}
        onPress={() => setIsClockOnlyMode(false)}>
        <Text style={[styles.clockOnlyExitText, {color: theme.textSecondary}]}>
          Çıkmak için dokun
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <StatusBar 
        barStyle={isDarkTheme ? "light-content" : "dark-content"} 
        backgroundColor="transparent"
        translucent={isClockOnlyMode || isRunning}
        hidden={isClockOnlyMode || isRunning} 
      />
      
      {showFinished ? (
        <Animated.View style={[styles.finishedContainer, {
          backgroundColor: theme.finishedBg,
          opacity: fadeAnim
        }]}>
          <Text style={[styles.finishedText, {color: theme.finishedText}]}>Bitti</Text>
        </Animated.View>
      ) : isClockOnlyMode ? (
        renderClockOnlyMode()
      ) : (
        <>
          <TouchableOpacity 
            style={styles.menuButton}
            onPress={handleMenuPress}>
            <Text style={[styles.menuDots, {color: theme.text}]}>⋮</Text>
          </TouchableOpacity>

          {renderScreen()}

          <Modal
            animationType="fade"
            transparent={true}
            visible={showMenu}
            onRequestClose={() => setShowMenu(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}>
              <View style={[styles.menuContainer, {backgroundColor: theme.menuBg}]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuOption('timer')}>
                  <Text style={[styles.menuItemText, {color: theme.text}]}>Zamanlayıcı</Text>
                </TouchableOpacity>
                <View style={[styles.menuDivider, {backgroundColor: theme.divider}]} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuOption('history')}>
                  <Text style={[styles.menuItemText, {color: theme.text}]}>Geçmiş</Text>
                </TouchableOpacity>
                <View style={[styles.menuDivider, {backgroundColor: theme.divider}]} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuOption('stats')}>
                  <Text style={[styles.menuItemText, {color: theme.text}]}>İstatistikler</Text>
                </TouchableOpacity>
                <View style={[styles.menuDivider, {backgroundColor: theme.divider}]} />
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuOption('settings')}>
                  <Text style={[styles.menuItemText, {color: theme.text}]}>Ayarlar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          <Modal
            animationType="fade"
            transparent={true}
            visible={showDeleteConfirm}
            onRequestClose={() => setShowDeleteConfirm(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowDeleteConfirm(false)}>
              <View style={[styles.confirmDialog, {backgroundColor: theme.menuBg}]}>
                <Text style={[styles.confirmTitle, {color: theme.text}]}>Geçmişi Sil</Text>
                <Text style={[styles.confirmMessage, {color: theme.text}]}>
                  Geçmişi silmek istediğinize emin misiniz?
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.cancelButton]}
                    onPress={() => setShowDeleteConfirm(false)}>
                    <Text style={[styles.confirmButtonText, {color: theme.text}]}>Hayır</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.confirmButton, styles.deleteConfirmButton]}
                    onPress={handleDeleteHistory}>
                    <Text style={[styles.confirmButtonText, {color: theme.text}]}>Evet</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </Modal>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  menuButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 10,
    zIndex: 1,
  },
  menuDots: {
    fontSize: 24,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    position: 'absolute',
    top: 90,
    left: 20,
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 5,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#333333',
  },
  screenContainer: {
    flex: 1,
    width: '100%',
  },
  pageTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  headerContainer: {
    width: '100%',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '300',
    color: '#FFFFFF',
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  settingsContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
    fontWeight: '400',
  },
  settingInput: {
    width: 80,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  timerContainer: {
    position: 'absolute',
    top: Dimensions.get('window').height > Dimensions.get('window').width ? '35%' : '21%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 148,
    fontWeight: Platform.select({
      ios: '100',
      android: '100',
    }),
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif-thin',
    }),
    opacity: 0.65,
    includeFontPadding: false,
    letterSpacing: 4,
  },
  timerInput: {
    fontSize: 148,
    fontWeight: Platform.select({
      ios: '100',
      android: '100',
    }),
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif-thin',
    }),
    textAlign: 'center',
    minWidth: 120,
    padding: 0,
    opacity: 0.65,
    includeFontPadding: false,
    letterSpacing: 4,
  },
  minuteText: {
    fontSize: 20,
    fontWeight: '200',
    marginLeft: 10,
    opacity: 0.8,
  },
  startButton: {
    position: 'absolute',
    bottom: Dimensions.get('window').height > Dimensions.get('window').width ? 150 : 30,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 30,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '300',
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '200',
    marginTop: 20,
    marginBottom: 40,
    textAlign: 'center',
    width: '100%',
  },
  historyList: {
    width: '100%',
    flex: 1,
  },
  dateSection: {
    paddingHorizontal: 20,
    borderTopWidth: 0.2,
    borderTopColor: '#333',
  },
  dateSectionTitle: {
    color: '#999999',
    fontSize: 14,
    fontWeight: '300',
    paddingVertical: 15,
    letterSpacing: 1,
    borderBottomWidth: 0.2,
    borderBottomColor: '#333333',
    marginBottom: 5,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: '#333333',
    opacity: 0.3,
  },
  itemLeft: {
    alignItems: 'flex-start',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 18,
    marginRight: 8,
    fontWeight: '300',
    includeFontPadding: false,
    lineHeight: 20,
  },
  completedIcon: {
    color: '#4CAF50',
  },
  failedIcon: {
    color: '#FF5252',
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '300',
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '300',
  },
  statusNote: {
    color: '#999999',
    fontSize: 12,
    fontWeight: '300',
    marginTop: 2,
    marginLeft: 18,
  },
  settingValue: {
    fontSize: 16,
    color: '#999999',
    fontWeight: '400',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmDialog: {
    borderRadius: 14,
    padding: 20,
    width: '80%',
    maxWidth: 320,
    alignSelf: 'center',
    marginTop: 'auto',
    marginBottom: 'auto',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  cancelButton: {
    backgroundColor: '#404040',
  },
  deleteConfirmButton: {
    backgroundColor: '#FF3B30',
  },
  dangerButton: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  currentTimeText: {
    fontSize: 24,
    fontWeight: '200',
    opacity: 0.5,
    letterSpacing: 2,
  },
  clockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: -35,
  },
  colonStyle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '200',
    letterSpacing: 2,
  },
  finishedContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  finishedText: {
    fontSize: 48,
    fontWeight: '200',
    color: '#000',
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif-light'
    }),
    letterSpacing: 2,
  },
  statsContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
  },
  statsSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  statsSectionTitle: {
    fontSize: 18,
    fontWeight: '400',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '400',
  },
  productiveHoursContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  hourBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  hourText: {
    fontSize: 14,
    fontWeight: '400',
  },
  clockOnlyContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clockOnlyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockOnlyText: {
    fontWeight: '200',
    letterSpacing: 2,
    fontFamily: Platform.select({
      ios: 'Helvetica Neue',
      android: 'sans-serif-thin',
    }),
  },
  clockOnlyExitButton: {
    position: 'absolute',
    bottom: 40,
    padding: 20,
  },
  clockOnlyExitText: {
    fontSize: 14,
    fontWeight: '300',
    opacity: 0.5,
  },
});

export default App;
