/* eslint-disable jsx-a11y/accessible-emoji */
import { Col, Form, Input, Row, Space, Spin, Table } from 'antd';
import FeatherIcon from 'feather-icons-react';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/buttons/buttons';
import { Cards } from '../../../components/cards/frame/cards-frame';
import CustomForm from '../../../components/customForm';
import { Modal } from '../../../components/modal/customModal';
import { SocialService } from '../../../config/dataService/socialService';
import { logOut } from '../../../redux/authentication/actionCreator';
import { setUserData } from '../../../redux/userData/actionCreator';
import { apiRoutes } from '../../../utility/apiRoutes';
import { removeItem } from '../../../utility/localStorageControl';
import { addNotificationError } from '../../../utility/notifications';
import { openNotificationType } from '../../../utility/utility';
import { TableWrapper } from '../../styled';
import { passwordForm, userForm } from './form';
import { AudioOutlined } from '@ant-design/icons';

const { Search } = Input;

const suffix = (
  <AudioOutlined
    style={{
      fontSize: 16,
      color: '#1890ff',
    }}
  />
);

const Users = () => {
  const dispatch = useDispatch();
  const { userData: user } = useSelector(state => ({ userData: state.userData }));
  const [isLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [activeUser, setActiveUser] = useState({});
  const [passwordModal, setPasswordModal] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    // {
    //   title: 'Perfil',
    //   dataIndex: 'userProfiles',
    //   key: 'userProfiles',
    //   sorter: (a, b) => {
    //   return a.perfil.profileId - b.perfil.profileId;
    //   },
    //   render: text =>
    //      <div style={{ textAlign: 'left' }}>
    //        {text.profileId === 1 ? 'Agente' : text.profileId === 2 ? 'Supervisor' : 'Administrador'}

    //       {text}
    //      </div>
    //     console.log(text.profileId),
    // },
    {
      title: 'Nombre',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Apellido',
      dataIndex: 'lastname',
      key: 'lastname',
      sorter: (a, b) => (a.lastname || '').localeCompare(b.lastname || ''),
    },
    {
      title: 'Nombre de Usuario',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => (a.username || '').localeCompare(b.username || ''),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      sorter: (a, b) => (a.email || '').localeCompare(b.email || ''),
    },
    {
      title: 'Accion',
      dataIndex: 'action',
      key: 'action',
    },
  ];

  const [users, setUsers] = useState([]);

  const [dataInicial, setDataInicial] = useState();

  const getUsers = data => {
    return async dispatch => {
      try {
        const response = await SocialService.get(apiRoutes.users.allUsers, {
          accountId: user.data.account[0].accountId,
        });
        if (response.data && Object.keys(response.data).length) {
          setUsers(response.data);
          setDataInicial(response.data);
        } else {
          removeItem('access_token');
          dispatch(
            setUserData({
              name: 'User',
              lastname: '',
            }),
          );
          dispatch(logOut());
        }
      } catch (err) {
        await addNotificationError('Ha surgido un error. Porfavor intentelo de nuevo');
      }
    };
  };

  useEffect(() => {
    if (user.loading === false && user.data.status && user.data.account) {
      dispatch(getUsers());
    }
  }, [dispatch, user]);

  useEffect(() => {
    Object.keys(activeUser).forEach(userKey => {
      if (userKey === 'userProfiles') {
        form.setFieldsValue({
          profiles: activeUser[userKey][0].profileId,
        });
      } else {
        form.setFieldsValue({
          [userKey]: activeUser[userKey],
        });
      }
    });
  }, [activeUser]);

  const data = [];

  const [searchText, setSearchText] = useState(``);

  const handleChange = value => {
    setSearchText(value);
    filterData(value);
  };

  const filterData = value => {
    const lowerCaseValue = value.toLowerCase().trim();
    if (!lowerCaseValue) {
      // setDataInicial(users);
    } else {
      const filteredData = data.filter(item => {
        return Object.keys(item).some(key =>
          item[key]
            .toString()
            .toLowerCase()
            .includes(lowerCaseValue),
        );
      });
      setDataInicial(filteredData);
      console.log(filteredData);
    }
  };
  // console.log(dataInicial);
  if (dataInicial !== undefined) {
    dataInicial.map((inbox, key) => {
      const { userId: id, name, username, lastname, email, updatedAt, changedPassword, rememberToken } = inbox;

      return data.push({
        key: id,

        username,
        name,
        lastname,
        email,
        updatedAt,
        rememberToken,
        changedPassword,
        action: (
          <div className="table-actions">
            <Link className="lock" to="#">
              <FeatherIcon
                icon="lock"
                size={14}
                onClick={() => {
                  setPasswordModal(true);
                  setActiveUser(inbox);
                }}
              />
            </Link>
            &nbsp;&nbsp;&nbsp; &nbsp;&nbsp;
            <Link className="edit" to="#">
              <FeatherIcon
                icon="edit"
                size={14}
                onClick={() => {
                  setOpenModal(true);
                  setActiveUser(inbox);
                }}
              />
            </Link>
            &nbsp;&nbsp;&nbsp;
            <Link
              className="delete"
              to="#"
              onClick={() => {
                setOpenDeleteModal(true);
                setActiveUser(inbox);
              }}
            >
              <FeatherIcon icon="trash-2" size={14} />
            </Link>
          </div>
        ),
      });
    });
  }

  const createUser = data => {
    return async dispatch => {
      try {
        const optionalHeader = {
          account: user.data.account[0].accountId,
        };
        const response = await SocialService.post(apiRoutes.users.createUser, data, optionalHeader);
        const { status = '', userCreated } = response.data || {};

        if (status.toString() === '201') {
          openNotificationType('success', 'Operación realizada con éxito', response.message);
          setUsers([...users, userCreated]);
        }
      } catch (err) {
        console.log('err', err);

        await addNotificationError('Ha surgido un error. Porfavor intentelo de nuevo');
      }
    };
  };

  const updateUser = data => {
    return async dispatch => {
      try {
        const optionalHeader = {
          account: user.data.account[0].accountId,
        };
        const response = await SocialService.put(apiRoutes.users.updateUser(activeUser.userId), data, optionalHeader);
        const { status, userUpdated } = response.data;

        if (status.toString() === '201') {
          openNotificationType('success', 'Operación realizada con éxito', response.message);
          const changeUser = users.filter(user => user.userId !== activeUser.userId);

          setUsers([...changeUser, userUpdated]);
          setActiveUser({});
        }
      } catch (err) {
        await addNotificationError('Ha surgido un error. Porfavor intentelo de nuevo');
      }
    };
  };

  function addUser(value) {
    if (!Object.keys(activeUser).length) {
      // New user
      const data = {
        ...value,
        status: 'ACTIVE',
        userProfiles: [{ profileId: value.profiles }],
        changedPassword: value.changedPassword ? 'yes' : 'no',
        rememberToken: value.rememberToken ? 'yes' : 'no',
        createdAt: moment().format('YYYY-MM-DD'),
        updatedAt: moment().format('YYYY-MM-DD'),
      };

      dispatch(createUser(data));
    } else {
      // New user
      const data = {
        ...value,
        userProfiles: [{ profileId: value.profiles }],
      };
      // Update user
      dispatch(updateUser(data));
    }
  }

  const deleteUserId = data => {
    return async dispatch => {
      try {
        const response = await SocialService.delete(apiRoutes.users.deleteUser(activeUser.userId), data);
        const { status } = response.data;

        if (status.toString() === '201') {
          const deleteUser = users.filter(user => user.userId !== activeUser.userId);

          setUsers(deleteUser);
          setOpenDeleteModal(false);
          setActiveUser({});
          openNotificationType('success', 'Operación realizada con éxito', response.message);
        }
      } catch (err) {
        await addNotificationError('Ha surgido un error. Porfavor intentelo de nuevo');
      }
    };
  };

  function deleteUser() {
    if (Object.keys(activeUser).length) {
      dispatch(deleteUserId());
    }
  }

  async function changePassword(value) {
    if (Object.keys(activeUser).length) {
      try {
        const response = await SocialService.put(apiRoutes.users.changePassword(activeUser.userId), value);

        if (response.data) {
          setPasswordModal(false);
          setActiveUser({});
          openNotificationType('success', 'Operación realizada con éxito', 'Contraseña actualizada');
        }
      } catch (err) {
        await addNotificationError('Ha surgido un error. Porfavor intentelo de nuevo');
      }
    }
  }

  return (
    <>
      <Row gutter={15}>
        <Col className="w-100" md={24}>
          <Cards
            isbutton={
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                      form.resetFields();
                      setActiveUser({});
                      setOpenModal(true);
                    }}
                  >
                    <FeatherIcon icon="plus" size={16} />
                    Agregar usuario
                  </Button>
                  <Space direction="vertical">
                    <Search
                      placeholder="Buscador"
                      onChange={e => handleChange(e.target.value)}
                      allowClear
                      enterButton
                    />
                  </Space>
                </div>
              </>
            }
          >
            {isLoading ? (
              <div className="spin">
                <Spin />
              </div>
            ) : (
              <div>
                <TableWrapper className="table-data-view table-responsive">
                  <Table pagination={{ pageSize: 10 }} dataSource={data} columns={columns} />
                </TableWrapper>
              </div>
            )}
          </Cards>
        </Col>
        <Modal
          visible={openModal}
          onCancel={() => {
            setOpenModal(false);
            setActiveUser({});
          }}
          onOk={() => {
            form.submit();
          }}
          title="Agregar Usuario"
          type="primary"
          color=""
          className=""
          okText="Guardar Cambios"
        >
          <CustomForm
            items={userForm(Object.keys(activeUser).length)}
            form={form}
            handleSubmit={value => {
              addUser(value);
              setOpenModal(false);
            }}
          />
        </Modal>

        <Modal
          visible={openDeleteModal}
          onCancel={() => {
            setOpenDeleteModal(false);
            setActiveUser({});
          }}
          onOk={deleteUser}
          title="Eliminar Usuario"
          type="primary"
          color=""
          className=""
          okText="Guardar Cambios"
        >
          <div>Esta seguro que desea eliminar:</div>
          <div style={{ textAlign: 'center' }}>{`Nombre: ${activeUser.name} ${activeUser.lastname}`} </div>
        </Modal>

        <Modal
          visible={passwordModal}
          onCancel={() => {
            setPasswordModal(false);
            setActiveUser({});
          }}
          onOk={() => {
            form.submit();
          }}
          title="Cambiar Contraseña"
          type="primary"
          color=""
          className=""
          okText="Guardar Cambios"
        >
          <CustomForm
            items={passwordForm}
            form={form}
            handleSubmit={value => {
              changePassword(value);
            }}
          />
        </Modal>
      </Row>
    </>
  );
};

Users.propTypes = {
  match: PropTypes.object,
};
export default Users;
