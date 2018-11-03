import React, { Component } from 'react';
import classnames from 'classnames';
import FindContactModal from './FindContactModal';
import user from '../user.png';

import './Contacts.scss';
import TimeAgo from '../lib/components/TimeAgo';

const newMessageSound = new Audio('/pop.mp3');

export default class Contacts extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isFindModalOpen: false,
      contacts: []
    };

    this.addContact = this.addContact.bind(this)
    this.openFindModal = this.changeFindModalState.bind(this, true);
    this.closeFindModal = this.changeFindModalState.bind(this, false);
  }

  addContact (userId) {
    this.props.me.addContact(userId)
      .then(user => {
        this.props.notify(`${user.data.username} added to contacts.`)
      })
  }

  changeFindModalState (state) {
    this.setState({
      isFindModalOpen: state
    })
  }

  componentDidMount () {
    this.props.me.getContacts()
      .then(contacts => {
        contacts.forEach(contact =>
          contact.setActive = () => this.props.setOther(contact)
        )
        this.setState({ contacts })
      })

    this.props.me.addListener('new message', ({ conversationId, message }) => {
      const contact = this.state.contacts
        .find(contact => contact.conversationId === conversationId)

      if (message.receiver === this.props.me.data._id) {
        contact.unreadCount = contact.unreadCount ? contact.unreadCount + 1 : 1;

        this.props.notify(`New Message: ${message.body}`);

        newMessageSound.play();
      }
      contact.lastMessage = message
      this.setState({
        contacts: this.state.contacts
      })
    })

    this.props.me.addListener('marked seen', message => {
      if (message.receiver !== this.props.me.data._id) {
        return
      }
      const contact = this.state.contacts
        .find(contact => contact._id === message.sender)

      contact.unreadCount = contact.unreadCount - 1
      this.setState({
        contacts: this.state.contacts
      })
    })
  }

  render () {
    const {
      active
    } = this.props

    return (
      <aside className="app__contacts">
        <header className='contacts__header'>
          <div className='contacts__title'>
            Contacts
          </div>
          <div className='contacts__find' onClick={this.openFindModal}>
            Find...
          </div>
        </header>
        <ul className="contacts__list">
          {this.state.contacts.map((contact, index) => (
            <li
              key={index}
              onClick={contact.setActive}
              className={classnames(
                'contacts__contact',
                active === contact && 'contact--active'
              )}>
              <div className='contact__avatar'>
                <img
                  src={contact.photoUrl || user}
                  alt='user avatar'
                  className='contact__avatar' />
                {!!contact.unreadCount && (
                  <div className='contact__badge'>
                    {contact.unreadCount}
                  </div>
                )}
              </div>
              <div className='contact__info'>
                <div className='contact__username'>
                  {contact.username}
                </div>
                {contact.lastMessage && (
                  <div className='contact__message'>
                    <div className='contact__body'>
                      {contact.lastMessage.body}
                    </div>
                    <TimeAgo className='contact__time'>
                      {contact.lastMessage.receivedAt}
                    </TimeAgo>&nbsp;ago
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
        <FindContactModal
          isOpen={this.state.isFindModalOpen}
          onAdd={this.addContact}
          handleClose={this.closeFindModal} />
      </aside>
    )
  }
}