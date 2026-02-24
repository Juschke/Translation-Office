import React, { useState } from 'react';
import CompanySettingsTab from '../components/settings/CompanySettingsTab';
import InvoiceSettingsTab from '../components/settings/InvoiceSettingsTab';
import MasterDataTab from '../components/settings/MasterDataTab';
import AuditLogsTab from '../components/settings/AuditLogsTab';
import ProfileTab from '../components/settings/ProfileTab';
import { Typography, Menu, Layout } from 'antd';
import { UserOutlined, BankOutlined, FileTextOutlined, DatabaseOutlined, HistoryOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Sider, Content } = Layout;

const tabs = [
    { key: 'profile', label: 'Profil', icon: <UserOutlined /> },
    { key: 'company', label: 'Unternehmen', icon: <BankOutlined /> },
    { key: 'invoice', label: 'Rechnung & Angebot', icon: <FileTextOutlined /> },
    { key: 'master_data', label: 'Stammdaten', icon: <DatabaseOutlined /> },
    { key: 'audit', label: 'Audit Logs', icon: <HistoryOutlined /> },
];

const Settings: React.FC = () => {
    const [activeTab, setActiveTab] = useState('company');

    return (
        <div className="flex flex-col gap-6 fade-in pb-10">
            <div className="min-w-0">
                <Title level={4} style={{ margin: 0 }}>System Einstellungen</Title>
                <Text type="secondary">Zentrale Konfiguration für Ihr Translation Office.</Text>
            </div>

            <Layout className="bg-transparent">
                <Sider width={240} className="bg-white border border-slate-200" theme="light">
                    <div className="p-2">
                        <Text strong type="secondary" className="block px-3 mb-2 uppercase tracking-wider text-[10px]">Konfiguration</Text>
                        <Menu
                            mode="inline"
                            selectedKeys={[activeTab]}
                            onClick={({ key }) => setActiveTab(key)}
                            items={tabs}
                            className="border-none"
                        />
                    </div>
                </Sider>
                <Content className="pl-6 bg-transparent">
                    <div className="fade-in">
                        {activeTab === 'profile' && <ProfileTab />}
                        {activeTab === 'company' && <CompanySettingsTab />}
                        {activeTab === 'invoice' && <InvoiceSettingsTab />}
                        {activeTab === 'master_data' && <MasterDataTab />}
                        {activeTab === 'audit' && <AuditLogsTab />}
                    </div>
                </Content>
            </Layout>
        </div>
    );
};

export default Settings;
