import React, { useEffect, useState } from "react";
import MapView from "../components/MapView";
import { Slider, Switch, Radio, Button, Collapse, Checkbox, message } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import axios from 'axios';
import 'antd/dist/reset.css';
import './Dashboard.css';

const { Panel } = Collapse;
const { Group: RadioGroup } = Radio;
const CheckboxGroup = Checkbox.Group;

interface DashboardProps {
  token: string;
  userId: string;
  setReceiverId?: (id: string) => void;
}

interface FilterState {
  businessHours: [number, number]; // 營業時間範圍，例如 [9, 22] 表示 9:00-22:00
  openDays: string[]; // 營業日：週一到週日
  price: [number, number]; // 價格範圍
  lighting: number; // 光線 1-5
  noTimeLimit: boolean; // 是否不限時
  powerOutlets: number; // 插座數量 0-3
  noiseLevel: string; // 吵雜程度: 'quiet' | 'moderate' | 'noisy'
  paymentMethods: string[]; // 支付方式: ['electronic', 'cash']
  wifi: string; // WiFi: 'none' | 'weak' | 'strong'
  toilet: boolean; // 是否有廁所
}

const allDays = [
  { label: '一', value: 'monday' },
  { label: '二', value: 'tuesday' },
  { label: '三', value: 'wednesday' },
  { label: '四', value: 'thursday' },
  { label: '五', value: 'friday' },
  { label: '六', value: 'saturday' },
  { label: '日', value: 'sunday' },
];

const Dashboard: React.FC<DashboardProps> = ({ token, userId, setReceiverId }) => {
  const [filters, setFilters] = useState<FilterState>({
    businessHours: [9, 21],
    openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    price: [0, 500],
    lighting: 3,
    noTimeLimit: false,
    powerOutlets: 1,
    noiseLevel: 'moderate',
    paymentMethods: ['electronic', 'cash'],
    wifi: 'strong',
    toilet: true
  });

  const [cafes, setCafes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  
  const [isFilterVisible, setIsFilterVisible] = useState(false); // 默認收起篩選欄

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const loadCafes = async (withFilters = false) => {
    setLoading(true);
    
    try {
      let response;
      
      if (withFilters) {
        // 使用篩選條件
        const filterData = {
          business_hours_start: filters.businessHours[0],
          business_hours_end: filters.businessHours[1],
          open_days: filters.openDays,
          price_min: filters.price[0],
          price_max: filters.price[1],
          lighting: filters.lighting,
          no_time_limit: filters.noTimeLimit,
          power_outlets: filters.powerOutlets,
          noise_level: filters.noiseLevel,
          payment_methods: filters.paymentMethods,
          wifi_strength: filters.wifi,
          has_toilet: filters.toilet
        };
        
        response = await axios.post(
          `${process.env.REACT_APP_API_URL}/cafes/filter`, 
          filterData,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      } else {
        // 無篩選條件
        response = await axios.get(
          `${process.env.REACT_APP_API_URL}/cafes`, 
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }
      
      setCafes(response.data);
    } catch (error) {
      console.error("Failed to load cafes:", error);
      message.error("無法載入咖啡廳資料");
    } finally {
      setLoading(false);
    }
  };
  
  // 初次加載時獲取所有咖啡廳
  useEffect(() => {
    loadCafes();
  }, []);
  
  // 應用篩選條件
  const applyFilters = () => {
    loadCafes(true);
    toggleFilter(); // 應用篩選後隱藏篩選面板
  };
  
  // 修改重置篩選，添加重新載入資料
  const resetFilters = () => {
    setFilters({
      businessHours: [9, 21],
      openDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      price: [0, 500],
      lighting: 3,
      noTimeLimit: false,
      powerOutlets: 1,
      noiseLevel: 'moderate',
      paymentMethods: ['electronic', 'cash'],
      wifi: 'strong',
      toilet: true
    });
    // 重置後也重新載入所有咖啡廳
    loadCafes();
  };

  const formatTime = (time: number | undefined) => {
    if (time === undefined) return '';
    const hour = Math.floor(time);
    const minutes = Math.round((time - hour) * 60);
    return `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const toggleFilter = () => {
    setIsFilterVisible(!isFilterVisible);
  };

  const onOpenDaysChange = (checkedValues: string[] | number[]) => {
    handleFilterChange('openDays', checkedValues as string[]);
  };

  // 計算今天是星期幾，用於突出顯示
  const today = new Date().getDay(); // 0-6 代表週日-週六
  const todayValue = today === 0 ? 'sunday' : ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today - 1];

  return (
    <div className="dashboard-container">
      {/* 篩選面板 */}
      <div className={`filter-section ${isFilterVisible ? 'visible' : 'hidden'}`}>
        <div className="filter-header">
          <h2>咖啡廳篩選</h2>
          <Button 
            type="text" 
            icon={<MenuFoldOutlined />}
            onClick={toggleFilter}
            className="toggle-button close-filter"
          />
        </div>
        
        <Collapse defaultActiveKey={['1', '2', '3']} bordered={false} className="earth-tone-collapse">
          <Panel header="基本條件" key="1" className="filter-panel">
            <div className="filter-item">
              <h4>營業時間</h4>
              <div className="time-display">
                {formatTime(filters.businessHours[0])} - {formatTime(filters.businessHours[1])}
              </div>
              <Slider
                range
                min={0}
                max={24}
                step={0.5}
                value={filters.businessHours}
                onChange={(value) => handleFilterChange('businessHours', value as [number, number])}
                tipFormatter={formatTime}
                className="earth-tone-slider"
              />
            </div>
            
            {/* 新增星期篩選 */}
            <div className="filter-item">
              <h4>營業日</h4>
              <div className="open-days-container">
                <CheckboxGroup 
                  options={allDays} 
                  value={filters.openDays} 
                  onChange={onOpenDaysChange} 
                  className="earth-tone-checkbox-group" 
                />
                <div className="day-shortcuts">
                  <Button 
                    size="small" 
                    onClick={() => handleFilterChange('openDays', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'])} 
                    className="earth-tone-day-btn"
                  >
                    週一至五
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => handleFilterChange('openDays', ['saturday', 'sunday'])} 
                    className="earth-tone-day-btn"
                  >
                    週末
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => handleFilterChange('openDays', [todayValue])} 
                    className="earth-tone-day-btn today-btn"
                  >
                    今天
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="filter-item">
              <h4>價格範圍</h4>
              <div className="price-display">
                NT$ {filters.price[0]} - NT$ {filters.price[1]}
              </div>
              <Slider
                range
                min={0}
                max={1000}
                step={50}
                value={filters.price}
                onChange={(value) => handleFilterChange('price', value as [number, number])}
                tipFormatter={(value) => `NT$ ${value}`}
                className="earth-tone-slider"
              />
            </div>
            
            <div className="filter-item switch-item">
              <h4>不限時</h4>
              <Switch
                checked={filters.noTimeLimit}
                onChange={(checked: boolean) => handleFilterChange('noTimeLimit', checked)}
                className="earth-tone-switch"
              />
            </div>
            
            <div className="filter-item switch-item">
              <h4>有廁所</h4>
              <Switch
                checked={filters.toilet}
                onChange={(checked: boolean) => handleFilterChange('toilet', checked)}
                className="earth-tone-switch"
              />
            </div>
          </Panel>
          
          <Panel header="環境條件" key="2" className="filter-panel">
            <div className="filter-item">
              <h4>光線程度</h4>
              <div className="slider-labels">
                <span>昏暗</span>
                <span>明亮</span>
              </div>
              <Slider
                min={1}
                max={5}
                value={filters.lighting}
                onChange={(value) => handleFilterChange('lighting', value)}
                marks={{ 1: '1', 2: '2', 3: '3', 4: '4', 5: '5' }}
                className="earth-tone-slider"
              />
            </div>
            
            <div className="filter-item">
              <h4>插座數量</h4>
              <div className="slider-labels">
                <span>無</span>
                <span>多</span>
              </div>
              <Slider
                min={0}
                max={3}
                value={filters.powerOutlets}
                onChange={(value) => handleFilterChange('powerOutlets', value)}
                marks={{ 0: '無', 1: '少', 2: '中', 3: '多' }}
                className="earth-tone-slider"
              />
            </div>
            
            <div className="filter-item">
              <h4>吵雜程度</h4>
              <RadioGroup
                value={filters.noiseLevel}
                onChange={(e) => handleFilterChange('noiseLevel', e.target.value)}
                className="earth-tone-radio"
              >
                <Radio value="quiet">超安靜</Radio>
                <Radio value="moderate">小聲交談</Radio>
                <Radio value="noisy">吵雜</Radio>
              </RadioGroup>
            </div>
          </Panel>
          
          <Panel header="設施服務" key="3" className="filter-panel">
            <div className="filter-item">
              <h4>WiFi</h4>
              <RadioGroup
                value={filters.wifi}
                onChange={(e) => handleFilterChange('wifi', e.target.value)}
                className="earth-tone-radio"
              >
                <Radio value="none">無</Radio>
                <Radio value="weak">弱</Radio>
                <Radio value="strong">強</Radio>
              </RadioGroup>
            </div>
            
            <div className="filter-item">
              <h4>支付方式</h4>
              <div className="checkbox-group earth-tone-checkbox">
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="electronic"
                    checked={filters.paymentMethods.includes('electronic')}
                    onChange={(e) => {
                      const updatedMethods = e.target.checked
                        ? [...filters.paymentMethods, 'electronic']
                        : filters.paymentMethods.filter(m => m !== 'electronic');
                      handleFilterChange('paymentMethods', updatedMethods);
                    }}
                  />
                  <label htmlFor="electronic">支援電子支付</label>
                </div>
                <div className="checkbox-item">
                  <input
                    type="checkbox"
                    id="cash"
                    checked={filters.paymentMethods.includes('cash')}
                    onChange={(e) => {
                      const updatedMethods = e.target.checked
                        ? [...filters.paymentMethods, 'cash']
                        : filters.paymentMethods.filter(m => m !== 'cash');
                      handleFilterChange('paymentMethods', updatedMethods);
                    }}
                  />
                  <label htmlFor="cash">現金</label>
                </div>
              </div>
            </div>
          </Panel>
        </Collapse>
        
        <div className="filter-actions">
          <Button onClick={resetFilters} className="earth-tone-btn">重置篩選</Button>
          <Button 
            type="primary" 
            className="earth-tone-btn apply-btn" 
            onClick={applyFilters}
            loading={loading}
          >
            套用篩選
          </Button>
        </div>
      </div>
      
      {/* 地圖區域 */}
      <div className={`map-section ${isFilterVisible ? 'with-filter' : 'full-width'}`}>
        <MapView 
          token={token} 
          userId={userId} 
          cafes={cafes} 
          loading={loading}
        />
      </div>
      
      {/* 漂浮的篩選按鈕 */}
      {!isFilterVisible && (
        <Button 
          className="filter-toggle-floating"
          type="primary"
          icon={<MenuUnfoldOutlined />}
          onClick={toggleFilter}
        >
          篩選條件
        </Button>
      )}
    </div>
  );
};

export default Dashboard;