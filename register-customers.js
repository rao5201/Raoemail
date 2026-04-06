const axios = require('axios');

// Base URL for the API
const API_BASE_URL = 'http://localhost:3001';

// Function to create a new email account
const createEmail = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/create-email`);
    return response.data;
  } catch (error) {
    console.error('Error creating email:', error.response?.data || error.message);
    return null;
  }
};

// Main function to register multiple customers
const registerCustomers = async (count) => {
  console.log(`开始注册 ${count} 个新客户...`);
  
  const successfulRegistrations = [];
  const failedRegistrations = [];
  
  for (let i = 1; i <= count; i++) {
    console.log(`注册客户 ${i}/${count}...`);
    
    const result = await createEmail();
    
    if (result && result.success) {
      successfulRegistrations.push(result);
      console.log(`客户 ${i} 注册成功: ${result.email}`);
    } else {
      failedRegistrations.push(i);
      console.log(`客户 ${i} 注册失败`);
    }
    
    // Add a small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n注册完成!');
  console.log(`成功注册: ${successfulRegistrations.length} 个客户`);
  console.log(`失败注册: ${failedRegistrations.length} 个客户`);
  
  if (successfulRegistrations.length > 0) {
    console.log('\n前5个成功注册的客户:');
    successfulRegistrations.slice(0, 5).forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.email} - ${customer.password}`);
    });
  }
};

// Run the registration process
registerCustomers(100);