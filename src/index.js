export default {
    async fetch(request, env, ctx) {
      const url = new URL(request.url);
      
      // 只处理GET请求
      if (request.method !== 'GET') {
        return new Response('Method not allowed', { status: 405 });
      }
      
      // 返回完整的HTML页面
      const html = `<!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>聚会AA分钱计算器</title>
      <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
      <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
          body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', sans-serif; }
      </style>
  </head>
  <body>
      <div id="root"></div>
      
      <script type="text/babel">
          const { useState } = React;
          
          // Lucide React图标组件（简化版）
          const PlusIcon = () => (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
          );
          
          const MinusIcon = () => (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
          );
          
          const CalculatorIcon = () => (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="2" width="16" height="20" rx="2"></rect>
                  <line x1="8" y1="6" x2="16" y2="6"></line>
                  <line x1="16" y1="10" x2="8" y2="10"></line>
                  <line x1="8" y1="14" x2="12" y2="14"></line>
                  <line x1="8" y1="18" x2="12" y2="18"></line>
                  <circle cx="16" cy="16" r="2"></circle>
              </svg>
          );
          
          const UsersIcon = () => (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
          );
          
          const ReceiptIcon = () => (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path>
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                  <path d="M12 18V6"></path>
              </svg>
          );
          
          const UserCheckIcon = () => (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <polyline points="16,11 18,13 22,9"></polyline>
              </svg>
          );
  
          function AABillCalculator() {
              const [people, setPeople] = useState(['小明', '小红', '小刚']);
              const [newPersonName, setNewPersonName] = useState('');
              const [sharedExpenses, setSharedExpenses] = useState([]);
              const [partialExpenses, setPartialExpenses] = useState([]);
              const [individualExpenses, setIndividualExpenses] = useState([]);
              const [manualExpenses, setManualExpenses] = useState([]);
  
              // 添加参与者
              const addPerson = () => {
                  if (newPersonName.trim() && !people.includes(newPersonName.trim())) {
                      const name = newPersonName.trim();
                      setPeople([...people, name]);
                      setSharedExpenses(sharedExpenses.map(exp => ({
                          ...exp,
                          shares: {...exp.shares, [name]: 1}
                      })));
                      setManualExpenses(manualExpenses.map(exp => ({
                          ...exp,
                          amounts: {...exp.amounts, [name]: 0}
                      })));
                      setNewPersonName('');
                  }
              };
  
              // 删除参与者
              const removePerson = (name) => {
                  setPeople(people.filter(p => p !== name));
                  setIndividualExpenses(individualExpenses.filter(exp => exp.person !== name));
                  setSharedExpenses(sharedExpenses.map(exp => {
                      const newShares = {...exp.shares};
                      delete newShares[name];
                      return {...exp, shares: newShares};
                  }));
                  setPartialExpenses(partialExpenses.map(exp => ({
                      ...exp,
                      participants: exp.participants.filter(p => p.name !== name)
                  })));
                  setManualExpenses(manualExpenses.map(exp => {
                      const newAmounts = {...exp.amounts};
                      delete newAmounts[name];
                      return {...exp, amounts: newAmounts};
                  }));
              };
  
              // 添加全员共同费用
              const addSharedExpense = () => {
                  const shares = {};
                  people.forEach(p => { shares[p] = 1; });
                  setSharedExpenses([...sharedExpenses, { description: '', amount: 0, shares }]);
              };
  
              // 更新全员共同费用
              const updateSharedExpense = (index, field, value) => {
                  const updated = [...sharedExpenses];
                  updated[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
                  setSharedExpenses(updated);
              };
  
              // 删除全员共同费用
              const removeSharedExpense = (index) => {
                  setSharedExpenses(sharedExpenses.filter((_, i) => i !== index));
              };

              // 更新全员共同费用中某人的份数
              const updateSharedExpenseShares = (expenseIndex, personName, shares) => {
                  const updated = [...sharedExpenses];
                  updated[expenseIndex].shares[personName] = Math.max(1, parseInt(shares) || 1);
                  setSharedExpenses(updated);
              };

              // 添加部分参与者费用
              const addPartialExpense = () => {
                  setPartialExpenses([...partialExpenses, {
                      description: '',
                      amount: 0,
                      participants: [{name: people[0], shares: 1}]
                  }]);
              };
  
              // 更新部分参与者费用
              const updatePartialExpense = (index, field, value) => {
                  const updated = [...partialExpenses];
                  updated[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
                  setPartialExpenses(updated);
              };
  
              // 切换部分参与者费用的参与者
              const togglePartialParticipant = (expenseIndex, personName) => {
                  const updated = [...partialExpenses];
                  const participants = updated[expenseIndex].participants;
                  const existing = participants.find(p => p.name === personName);

                  if (existing) {
                      updated[expenseIndex].participants = participants.filter(p => p.name !== personName);
                  } else {
                      updated[expenseIndex].participants = [...participants, {name: personName, shares: 1}];
                  }

                  setPartialExpenses(updated);
              };

              // 更新部分参与者的份数
              const updatePartialParticipantShares = (expenseIndex, personName, shares) => {
                  const updated = [...partialExpenses];
                  const participant = updated[expenseIndex].participants.find(p => p.name === personName);
                  if (participant) {
                      participant.shares = Math.max(1, parseInt(shares) || 1);
                  }
                  setPartialExpenses(updated);
              };
  
              // 删除部分参与者费用
              const removePartialExpense = (index) => {
                  setPartialExpenses(partialExpenses.filter((_, i) => i !== index));
              };
  
              // 添加个人费用
              const addIndividualExpense = () => {
                  setIndividualExpenses([...individualExpenses, { person: people[0], description: '', amount: 0 }]);
              };
  
              // 更新个人费用
              const updateIndividualExpense = (index, field, value) => {
                  const updated = [...individualExpenses];
                  updated[index][field] = field === 'amount' ? parseFloat(value) || 0 : value;
                  setIndividualExpenses(updated);
              };
  
              // 删除个人费用
              const removeIndividualExpense = (index) => {
                  setIndividualExpenses(individualExpenses.filter((_, i) => i !== index));
              };

              // 添加手动分配费用
              const addManualExpense = () => {
                  const amounts = {};
                  people.forEach(p => { amounts[p] = 0; });
                  setManualExpenses([...manualExpenses, {description: '', amounts}]);
              };

              // 更新手动分配费用描述
              const updateManualExpenseDescription = (index, value) => {
                  const updated = [...manualExpenses];
                  updated[index].description = value;
                  setManualExpenses(updated);
              };

              // 更新手动分配费用中某人的金额
              const updateManualExpenseAmount = (index, personName, value) => {
                  const updated = [...manualExpenses];
                  updated[index].amounts[personName] = parseFloat(value) || 0;
                  setManualExpenses(updated);
              };

              // 删除手动分配费用
              const removeManualExpense = (index) => {
                  setManualExpenses(manualExpenses.filter((_, i) => i !== index));
              };

              // 计算结果
              const calculateResults = () => {
                  const results = people.map(person => {
                      const sharedAmount = sharedExpenses.reduce((sum, exp) => {
                          const totalShares = Object.values(exp.shares || {}).reduce((s, v) => s + v, 0);
                          const personShares = (exp.shares || {})[person] || 1;
                          const denom = totalShares > 0 ? totalShares : people.length;
                          return sum + (exp.amount * personShares / denom);
                      }, 0);
                      
                      const partialAmount = partialExpenses.reduce((sum, exp) => {
                          const totalShares = exp.participants.reduce((s, p) => s + p.shares, 0);
                          const personEntry = exp.participants.find(p => p.name === person);
                          if (personEntry && totalShares > 0) {
                              return sum + (exp.amount * personEntry.shares / totalShares);
                          }
                          return sum;
                      }, 0);
                      
                      const individualAmount = individualExpenses
                          .filter(exp => exp.person === person)
                          .reduce((sum, exp) => sum + exp.amount, 0);

                      const manualAmount = manualExpenses.reduce((sum, exp) => {
                          return sum + (exp.amounts[person] || 0);
                      }, 0);

                      return {
                          name: person,
                          sharedAmount,
                          partialAmount,
                          individualAmount,
                          manualAmount,
                          totalAmount: sharedAmount + partialAmount + individualAmount + manualAmount
                      };
                  });
  
                  return results;
              };
  
              const results = calculateResults();
              const totalAmount = results.reduce((sum, person) => sum + person.totalAmount, 0);
  
              return (
                  <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
                      <div className="mb-8">
                          <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                              <CalculatorIcon />
                              聚会AA分钱计算器
                          </h1>
                          <p className="text-gray-600">支持全员分摊、部分参与者分摊、个人费用和手动分配</p>
                      </div>
  
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* 左侧：参与者和费用录入 */}
                          <div className="lg:col-span-2 space-y-6">
                              {/* 参与者管理 */}
                              <div className="bg-gray-50 p-6 rounded-lg">
                                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                      <UsersIcon />
                                      参与者管理
                                  </h2>
                                  
                                  <div className="flex gap-2 mb-4">
                                      <input
                                          type="text"
                                          value={newPersonName}
                                          onChange={(e) => setNewPersonName(e.target.value)}
                                          placeholder="输入姓名"
                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                          onKeyPress={(e) => e.key === 'Enter' && addPerson()}
                                      />
                                      <button
                                          onClick={addPerson}
                                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                                      >
                                          <PlusIcon />
                                          添加
                                      </button>
                                  </div>
  
                                  <div className="flex flex-wrap gap-2">
                                      {people.map((person) => (
                                          <div key={person} className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border">
                                              <span className="text-sm">{person}</span>
                                              <button
                                                  onClick={() => removePerson(person)}
                                                  className="text-red-500 hover:text-red-700"
                                              >
                                                  <MinusIcon />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              </div>
  
                              {/* 全员共同费用 */}
                              <div className="bg-gray-50 p-6 rounded-lg">
                                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                      <ReceiptIcon />
                                      全员共同费用
                                  </h2>
                                  
                                  <button
                                      onClick={addSharedExpense}
                                      className="mb-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-1"
                                  >
                                      <PlusIcon />
                                      添加全员费用
                                  </button>
  
                                  <div className="space-y-4">
                                      {sharedExpenses.map((expense, index) => {
                                          const totalShares = Object.values(expense.shares || {}).reduce((s, v) => s + v, 0);
                                          const isWeighted = totalShares > 0 && people.some(p => (expense.shares || {})[p] !== 1);
                                          return (
                                              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                                                  <div className="flex gap-2 items-center mb-3">
                                                      <input
                                                          type="text"
                                                          value={expense.description}
                                                          onChange={(e) => updateSharedExpense(index, 'description', e.target.value)}
                                                          placeholder="费用描述"
                                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                      />
                                                      <input
                                                          type="number"
                                                          value={expense.amount}
                                                          onChange={(e) => updateSharedExpense(index, 'amount', e.target.value)}
                                                          placeholder="金额（元）"
                                                          className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                      />
                                                      <button
                                                          onClick={() => removeSharedExpense(index)}
                                                          className="text-red-500 hover:text-red-700 p-1"
                                                      >
                                                          <MinusIcon />
                                                      </button>
                                                  </div>

                                                  <div className="flex flex-wrap gap-3 items-center">
                                                      <span className="text-sm text-gray-500">每人份数（份数越多，分摊越多）:</span>
                                                      {people.map(person => {
                                                          const personShares = (expense.shares || {})[person] || 1;
                                                          return (
                                                              <label key={person} className="flex items-center gap-1 text-sm">
                                                                  <span className="text-gray-700">{person}</span>
                                                                  <input
                                                                      type="number"
                                                                      min="1"
                                                                      value={personShares}
                                                                      onChange={(e) => updateSharedExpenseShares(index, person, e.target.value)}
                                                                      className="w-12 px-1 py-0.5 border border-purple-300 rounded text-center text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                                  />
                                                                  <span className="text-gray-500 text-xs">份</span>
                                                              </label>
                                                          );
                                                      })}
                                                  </div>

                                                  {totalShares > 0 && (
                                                      <div className="mt-2 text-sm text-gray-500 flex flex-wrap gap-3">
                                                          {people.map(p => {
                                                              const ps = (expense.shares || {})[p] || 1;
                                                              return (
                                                                  <span key={p}>
                                                                      {p}: ¥{(expense.amount * ps / totalShares).toFixed(2)}
                                                                      {isWeighted && ps > 1 && <span className="text-purple-600 ml-1">×{ps}份</span>}
                                                                  </span>
                                                              );
                                                          })}
                                                      </div>
                                                  )}
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
  
                              {/* 部分参与者费用 */}
                              <div className="bg-gray-50 p-6 rounded-lg">
                                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                      <UserCheckIcon />
                                      部分参与者费用
                                  </h2>
                                  
                                  <button
                                      onClick={addPartialExpense}
                                      className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-1"
                                  >
                                      <PlusIcon />
                                      添加部分费用
                                  </button>
  
                                  <div className="space-y-4">
                                      {partialExpenses.map((expense, index) => (
                                          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                                              <div className="flex gap-2 items-center mb-3">
                                                  <input
                                                      type="text"
                                                      value={expense.description}
                                                      onChange={(e) => updatePartialExpense(index, 'description', e.target.value)}
                                                      placeholder="费用描述"
                                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                  />
                                                  <input
                                                      type="number"
                                                      value={expense.amount}
                                                      onChange={(e) => updatePartialExpense(index, 'amount', e.target.value)}
                                                      placeholder="金额（元）"
                                                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                  />
                                                  <button
                                                      onClick={() => removePartialExpense(index)}
                                                      className="text-red-500 hover:text-red-700 p-1"
                                                  >
                                                      <MinusIcon />
                                                  </button>
                                              </div>
                                              
                                              <div className="flex flex-wrap gap-2 items-center">
                                                  <span className="text-sm text-gray-600 mr-2">参与者:</span>
                                                  {people.map((person) => {
                                                      const entry = expense.participants.find(p => p.name === person);
                                                      const isParticipant = !!entry;
                                                      return (
                                                          <div key={person} className="flex items-center gap-1">
                                                              <button
                                                                  onClick={() => togglePartialParticipant(index, person)}
                                                                  className={\`px-2 py-1 text-xs rounded-full transition-colors \${
                                                                      isParticipant
                                                                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                                                                          : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'
                                                                  }\`}
                                                              >
                                                                  {person}
                                                              </button>
                                                              {isParticipant && (
                                                                  <div className="flex items-center gap-0.5">
                                                                      <input
                                                                          type="number"
                                                                          min="1"
                                                                          value={entry.shares}
                                                                          onChange={(e) => updatePartialParticipantShares(index, person, e.target.value)}
                                                                          className="w-10 px-1 py-0.5 border border-indigo-300 rounded text-center text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                                      />
                                                                      <span className="text-xs text-gray-500">份</span>
                                                                  </div>
                                                              )}
                                                          </div>
                                                      );
                                                  })}
                                              </div>

                                              {expense.participants.length > 0 && (
                                                  <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-2">
                                                      {(() => {
                                                          const totalShares = expense.participants.reduce((s, p) => s + p.shares, 0);
                                                          return expense.participants.map(p => (
                                                              <span key={p.name}>
                                                                  {p.name}: ¥{(expense.amount * p.shares / totalShares).toFixed(2)}
                                                                  {p.shares > 1 && <span className="text-indigo-600 ml-1">×{p.shares}份</span>}
                                                              </span>
                                                          ));
                                                      })()}
                                                  </div>
                                              )}
                                          </div>
                                      ))}
                                  </div>
                              </div>
  
                              {/* 个人费用 */}
                              <div className="bg-gray-50 p-6 rounded-lg">
                                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                      <ReceiptIcon />
                                      个人费用
                                  </h2>
                                  
                                  <button
                                      onClick={addIndividualExpense}
                                      className="mb-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 flex items-center gap-1"
                                  >
                                      <PlusIcon />
                                      添加个人费用
                                  </button>
  
                                  <div className="space-y-3">
                                      {individualExpenses.map((expense, index) => (
                                          <div key={index} className="flex gap-2 items-center">
                                              <select
                                                  value={expense.person}
                                                  onChange={(e) => updateIndividualExpense(index, 'person', e.target.value)}
                                                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                              >
                                                  {people.map(person => (
                                                      <option key={person} value={person}>{person}</option>
                                                  ))}
                                              </select>
                                              <input
                                                  type="text"
                                                  value={expense.description}
                                                  onChange={(e) => updateIndividualExpense(index, 'description', e.target.value)}
                                                  placeholder="费用描述"
                                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                              />
                                              <input
                                                  type="number"
                                                  value={expense.amount}
                                                  onChange={(e) => updateIndividualExpense(index, 'amount', e.target.value)}
                                                  placeholder="金额（元）"
                                                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                              />
                                              <button
                                                  onClick={() => removeIndividualExpense(index)}
                                                  className="text-red-500 hover:text-red-700 p-1"
                                              >
                                                  <MinusIcon />
                                              </button>
                                          </div>
                                      ))}
                                  </div>
                              </div>

                              {/* 手动分配费用 */}
                              <div className="bg-gray-50 p-6 rounded-lg">
                                  <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
                                      <ReceiptIcon />
                                      手动分配费用
                                  </h2>
                                  <p className="text-sm text-gray-500 mb-4">直接填写每人应付金额，适合账单已知各自份额的场景</p>

                                  <button
                                      onClick={addManualExpense}
                                      className="mb-4 px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 flex items-center gap-1"
                                  >
                                      <PlusIcon />
                                      添加手动账单
                                  </button>

                                  <div className="space-y-4">
                                      {manualExpenses.map((expense, index) => {
                                          const total = Object.values(expense.amounts).reduce((s, v) => s + v, 0);
                                          return (
                                              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                                                  <div className="flex gap-2 items-center mb-3">
                                                      <input
                                                          type="text"
                                                          value={expense.description}
                                                          onChange={(e) => updateManualExpenseDescription(index, e.target.value)}
                                                          placeholder="账单描述"
                                                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                      />
                                                      <button
                                                          onClick={() => removeManualExpense(index)}
                                                          className="text-red-500 hover:text-red-700 p-1"
                                                      >
                                                          <MinusIcon />
                                                      </button>
                                                  </div>

                                                  <div className="space-y-2">
                                                      {people.map(person => (
                                                          <div key={person} className="flex items-center gap-2">
                                                              <span className="text-sm text-gray-700 w-16 shrink-0">{person}</span>
                                                              <input
                                                                  type="number"
                                                                  value={expense.amounts[person] || 0}
                                                                  onChange={(e) => updateManualExpenseAmount(index, person, e.target.value)}
                                                                  placeholder="0"
                                                                  className="w-28 px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                              />
                                                              <span className="text-xs text-gray-400">元</span>
                                                          </div>
                                                      ))}
                                                  </div>

                                                  <div className="mt-2 text-sm text-gray-500 text-right">
                                                      合计: <span className="font-mono text-teal-700 font-medium">¥{total.toFixed(2)}</span>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              </div>
                          </div>

                          {/* 右侧：计算结果 */}
                          <div className="space-y-6">
                              <div className="bg-blue-50 p-6 rounded-lg">
                                  <h2 className="text-xl font-semibold mb-4 text-blue-800">
                                      分摊结果
                                  </h2>
                                  
                                  <div className="space-y-4">
                                      {results.map((person) => (
                                          <div key={person.name} className="bg-white p-4 rounded-lg shadow-sm">
                                              <div className="font-semibold text-gray-800 mb-2">{person.name}</div>
                                              <div className="space-y-1 text-sm">
                                                  <div className="flex justify-between">
                                                      <span className="text-gray-600">全员分摊：</span>
                                                      <span className="font-mono">¥{person.sharedAmount.toFixed(2)}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                      <span className="text-gray-600">部分分摊：</span>
                                                      <span className="font-mono">¥{person.partialAmount.toFixed(2)}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                      <span className="text-gray-600">个人费用：</span>
                                                      <span className="font-mono">¥{person.individualAmount.toFixed(2)}</span>
                                                  </div>
                                                  <div className="flex justify-between">
                                                      <span className="text-gray-600">手动分配：</span>
                                                      <span className="font-mono">¥{person.manualAmount.toFixed(2)}</span>
                                                  </div>
                                                  <div className="flex justify-between font-semibold text-blue-600 border-t pt-1">
                                                      <span>应付总额：</span>
                                                      <span className="font-mono">¥{person.totalAmount.toFixed(2)}</span>
                                                  </div>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
  
                                  <div className="mt-6 p-4 bg-green-100 rounded-lg">
                                      <div className="flex justify-between items-center">
                                          <span className="text-green-800 font-semibold">总费用：</span>
                                          <span className="text-green-800 font-bold text-lg font-mono">¥{totalAmount.toFixed(2)}</span>
                                      </div>
                                  </div>
                              </div>
  
                              {/* 费用明细 */}
                              <div className="bg-gray-50 p-6 rounded-lg">
                                  <h2 className="text-xl font-semibold mb-4 text-gray-800">费用明细</h2>
                                  
                                  {sharedExpenses.length > 0 && (
                                      <div className="mb-4">
                                          <h3 className="font-semibold text-purple-600 mb-2">全员共同费用</h3>
                                          <div className="space-y-2">
                                              {sharedExpenses.map((expense, index) => {
                                                  const totalShares = Object.values(expense.shares || {}).reduce((s, v) => s + v, 0);
                                                  const isWeighted = people.some(p => (expense.shares || {})[p] !== 1);
                                                  return (
                                                      <div key={index} className="text-sm">
                                                          <div className="flex justify-between">
                                                              <span>{expense.description || '未命名费用'}</span>
                                                              <span className="font-mono">¥{expense.amount.toFixed(2)}</span>
                                                          </div>
                                                          {isWeighted && totalShares > 0 && (
                                                              <div className="text-xs text-gray-500 ml-2">
                                                                  {people.map(p => p + '×' + ((expense.shares || {})[p] || 1) + '份').join('  ')}
                                                              </div>
                                                          )}
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      </div>
                                  )}
  
                                  {partialExpenses.length > 0 && (
                                      <div className="mb-4">
                                          <h3 className="font-semibold text-indigo-600 mb-2">部分参与者费用</h3>
                                          <div className="space-y-2">
                                              {partialExpenses.map((expense, index) => (
                                                  <div key={index} className="text-sm">
                                                      <div className="flex justify-between">
                                                          <span>{expense.description || '未命名费用'}</span>
                                                          <span className="font-mono">¥{expense.amount.toFixed(2)}</span>
                                                      </div>
                                                      <div className="text-xs text-gray-500 ml-2">
                                                          参与者: {expense.participants.map(p => p.shares > 1 ? \`\${p.name}×\${p.shares}份\` : p.name).join(', ')}
                                                      </div>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
  
                                  {individualExpenses.length > 0 && (
                                      <div>
                                          <h3 className="font-semibold text-orange-600 mb-2">个人费用</h3>
                                          <div className="space-y-2">
                                              {individualExpenses.map((expense, index) => (
                                                  <div key={index} className="flex justify-between text-sm">
                                                      <span>{expense.person} - {expense.description || '未命名费用'}</span>
                                                      <span className="font-mono">¥{expense.amount.toFixed(2)}</span>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}

                                  {manualExpenses.length > 0 && (
                                      <div className="mt-4">
                                          <h3 className="font-semibold text-teal-600 mb-2">手动分配费用</h3>
                                          <div className="space-y-2">
                                              {manualExpenses.map((expense, index) => {
                                                  const total = Object.values(expense.amounts).reduce((s, v) => s + v, 0);
                                                  return (
                                                      <div key={index} className="text-sm">
                                                          <div className="flex justify-between">
                                                              <span>{expense.description || '未命名费用'}</span>
                                                              <span className="font-mono">¥{total.toFixed(2)}</span>
                                                          </div>
                                                          <div className="text-xs text-gray-500 ml-2">
                                                              {Object.entries(expense.amounts)
                                                                  .filter(([, v]) => v > 0)
                                                                  .map(([name, v]) => \`\${name}: ¥\${v.toFixed(2)}\`)
                                                                  .join('  ')}
                                                          </div>
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          </div>
                      </div>
                  </div>
              );
          }
  
          // 渲染应用
          ReactDOM.render(<AABillCalculator />, document.getElementById('root'));
      </script>
  </body>
  </html>`;
  
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html;charset=UTF-8',
          'Cache-Control': 'public, max-age=86400', // 缓存24小时
        },
      });
    },
  };