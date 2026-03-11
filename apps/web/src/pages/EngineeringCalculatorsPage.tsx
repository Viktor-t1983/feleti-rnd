import { useState } from 'react';
import { Calculator, Wrench, Thermometer, Wind } from 'lucide-react';

interface ShaftResult {
  shear_stress_mpa: number;
  normal_stress_mpa: number;
  equivalent_stress_mpa: number;
  allowable_stress_mpa: number;
  safety_factor_actual: number;
  is_safe: boolean;
  recommendation: string;
}

interface ThermalResult {
  useful_power_kw: number;
  heat_loss_kw: number;
  efficiency_percent: number;
  delta_temp_c: number;
  recommendation: string;
}

interface VentilationResult {
  air_exchange_rate: number;
  supply_airflow_m3h: number;
  exhaust_airflow_m3h: number;
  fan_power_kw: number;
  heating_power_kw: number;
  recommendation: string;
}

const CALC_ENGINE_URL = 'http://localhost:8000';

function ShaftStrengthCalculator() {
  const [form, setForm] = useState({
    torque_nm: 500,
    diameter_mm: 50,
    material_yield_mpa: 355,
    bending_moment_nm: 0,
    axial_force_n: 0,
    safety_factor: 2.0,
  });
  const [result, setResult] = useState<ShaftResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${CALC_ENGINE_URL}/engineering/shaft-strength`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data.data);
    } catch {
      setError('Ошибка подключения к calc-engine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="text-blue-600" size={24} />
        <h2 className="text-xl font-bold">Прочность вала</h2>
        <span className="text-xs text-gray-400 ml-2">ГОСТ 21354-87</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Крутящий момент, Н·м
          </label>
          <input
            type="number"
            data-testid="shaft-torque"
            value={form.torque_nm}
            onChange={(e) => setForm({ ...form, torque_nm: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Диаметр вала, мм</label>
          <input
            type="number"
            data-testid="shaft-diameter"
            value={form.diameter_mm}
            onChange={(e) => setForm({ ...form, diameter_mm: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Предел текучести, МПа
          </label>
          <select
            value={form.material_yield_mpa}
            onChange={(e) => setForm({ ...form, material_yield_mpa: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value={235}>Сталь 20 — 235 МПа</option>
            <option value={355}>Сталь 45 — 355 МПа</option>
            <option value={590}>Сталь 40ХН — 590 МПа</option>
            <option value={785}>Сталь 40Х — 785 МПа</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Коэффициент запаса</label>
          <input
            type="number"
            step="0.1"
            value={form.safety_factor}
            onChange={(e) => setForm({ ...form, safety_factor: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Изгибающий момент, Н·м
          </label>
          <input
            type="number"
            value={form.bending_moment_nm}
            onChange={(e) => setForm({ ...form, bending_moment_nm: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Осевая сила, Н</label>
          <input
            type="number"
            value={form.axial_force_n}
            onChange={(e) => setForm({ ...form, axial_force_n: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <button
        onClick={calculate}
        disabled={loading}
        data-testid="shaft-calculate-btn"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Считаю...' : 'Рассчитать'}
      </button>

      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

      {result && (
        <div
          data-testid="shaft-result"
          className="mt-4 p-4 rounded-lg border-2"
          style={{
            borderColor: result.is_safe ? '#16a34a' : '#dc2626',
            background: result.is_safe ? '#f0fdf4' : '#fef2f2',
          }}
        >
          <p className="font-semibold text-lg mb-2">{result.recommendation}</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              Касательные напряжения: <b>{result.shear_stress_mpa} МПа</b>
            </div>
            <div>
              Эквивалентные напряжения: <b>{result.equivalent_stress_mpa} МПа</b>
            </div>
            <div>
              Допускаемые напряжения: <b>{result.allowable_stress_mpa} МПа</b>
            </div>
            <div>
              Запас прочности: <b>{result.safety_factor_actual}</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ThermalBalanceCalculator() {
  const [form, setForm] = useState({
    power_input_kw: 100,
    mass_flow_kg_s: 0.5,
    temp_inlet_c: 20,
    temp_outlet_c: 80,
    specific_heat_j_kgk: 3600,
    surface_area_m2: 10,
    insulation_thickness_m: 0.05,
  });
  const [result, setResult] = useState<ThermalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${CALC_ENGINE_URL}/engineering/thermal-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data.data);
    } catch {
      setError('Ошибка подключения к calc-engine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Thermometer className="text-orange-600" size={24} />
        <h2 className="text-xl font-bold">Тепловой баланс</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Мощность, кВт</label>
          <input
            type="number"
            value={form.power_input_kw}
            onChange={(e) => setForm({ ...form, power_input_kw: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Расход продукта, кг/с
          </label>
          <input
            type="number"
            step="0.01"
            value={form.mass_flow_kg_s}
            onChange={(e) => setForm({ ...form, mass_flow_kg_s: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Температура входа, °C
          </label>
          <input
            type="number"
            value={form.temp_inlet_c}
            onChange={(e) => setForm({ ...form, temp_inlet_c: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Температура выхода, °C
          </label>
          <input
            type="number"
            value={form.temp_outlet_c}
            onChange={(e) => setForm({ ...form, temp_outlet_c: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Теплоёмкость, Дж/(кг·К)
          </label>
          <select
            value={form.specific_heat_j_kgk}
            onChange={(e) => setForm({ ...form, specific_heat_j_kgk: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value={3600}>Мясо — 3600</option>
            <option value={4186}>Вода — 4186</option>
            <option value={2000}>Жир — 2000</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Площадь поверхности, м²
          </label>
          <input
            type="number"
            value={form.surface_area_m2}
            onChange={(e) => setForm({ ...form, surface_area_m2: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <button
        onClick={calculate}
        disabled={loading}
        data-testid="thermal-calculate-btn"
        className="w-full bg-orange-600 text-white py-2 rounded hover:bg-orange-700 disabled:opacity-50"
      >
        {loading ? 'Считаю...' : 'Рассчитать'}
      </button>

      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

      {result && (
        <div
          data-testid="thermal-result"
          className="mt-4 p-4 rounded-lg bg-orange-50 border border-orange-200"
        >
          <p className="font-semibold mb-2">{result.recommendation}</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              Полезная мощность: <b>{result.useful_power_kw} кВт</b>
            </div>
            <div>
              Тепловые потери: <b>{result.heat_loss_kw} кВт</b>
            </div>
            <div>
              КПД: <b>{result.efficiency_percent}%</b>
            </div>
            <div>
              Перепад температур: <b>{result.delta_temp_c} °C</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VentilationCalculator() {
  const [form, setForm] = useState({
    room_volume_m3: 500,
    room_type: 'production',
    workers_count: 10,
    heat_sources_kw: 0,
    room_temp_c: 16,
    outside_temp_c: -10,
  });
  const [result, setResult] = useState<VentilationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${CALC_ENGINE_URL}/engineering/ventilation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data.data);
    } catch {
      setError('Ошибка подключения к calc-engine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wind className="text-green-600" size={24} />
        <h2 className="text-xl font-bold">Вентиляция</h2>
        <span className="text-xs text-gray-400 ml-2">СП 60.13330.2020</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Объём помещения, м³
          </label>
          <input
            type="number"
            value={form.room_volume_m3}
            onChange={(e) => setForm({ ...form, room_volume_m3: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Тип помещения</label>
          <select
            value={form.room_type}
            onChange={(e) => setForm({ ...form, room_type: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="production">Производственное</option>
            <option value="cold_storage">Холодильная камера</option>
            <option value="cutting">Разделочный цех</option>
            <option value="packaging">Упаковочный цех</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Кол-во работников</label>
          <input
            type="number"
            value={form.workers_count}
            onChange={(e) => setForm({ ...form, workers_count: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Тепловыделения, кВт
          </label>
          <input
            type="number"
            value={form.heat_sources_kw}
            onChange={(e) => setForm({ ...form, heat_sources_kw: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Темп. помещения, °C
          </label>
          <input
            type="number"
            value={form.room_temp_c}
            onChange={(e) => setForm({ ...form, room_temp_c: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Темп. снаружи, °C</label>
          <input
            type="number"
            value={form.outside_temp_c}
            onChange={(e) => setForm({ ...form, outside_temp_c: +e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <button
        onClick={calculate}
        disabled={loading}
        data-testid="ventilation-calculate-btn"
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Считаю...' : 'Рассчитать'}
      </button>

      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}

      {result && (
        <div
          data-testid="ventilation-result"
          className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200"
        >
          <p className="font-semibold mb-2">{result.recommendation}</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              Приток: <b>{result.supply_airflow_m3h} м³/ч</b>
            </div>
            <div>
              Вытяжка: <b>{result.exhaust_airflow_m3h} м³/ч</b>
            </div>
            <div>
              Кратность: <b>{result.air_exchange_rate} /ч</b>
            </div>
            <div>
              Мощность вент.: <b>{result.fan_power_kw} кВт</b>
            </div>
            <div>
              Мощность калорифера: <b>{result.heating_power_kw} кВт</b>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EngineeringCalculatorsPage() {
  const [activeTab, setActiveTab] = useState<'shaft' | 'thermal' | 'ventilation'>('shaft');

  return (
    <div data-testid="engineering-calculators-page" className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="text-blue-600" size={32} />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Инженерные расчёты</h1>
          <p className="text-gray-500 text-sm">Расчёты для оборудования мясопереработки</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b">
        {[
          { key: 'shaft', label: 'Прочность вала' },
          { key: 'thermal', label: 'Тепловой баланс' },
          { key: 'ventilation', label: 'Вентиляция' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 font-medium rounded-t transition-colors ${activeTab === tab.key ? 'bg-white border-l border-r border-t -mb-px text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'shaft' && <ShaftStrengthCalculator />}
      {activeTab === 'thermal' && <ThermalBalanceCalculator />}
      {activeTab === 'ventilation' && <VentilationCalculator />}
    </div>
  );
}
