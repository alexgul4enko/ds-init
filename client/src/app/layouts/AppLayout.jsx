import PropTypes from 'prop-types'
import Header from './Header'
import Footer from './Footer'

AppLayout.propTypes = {
  children: PropTypes.node,
}

AppLayout.defaultProps = {
  children: null,
}

export default function AppLayout({ children }) {
  return (
    <div className="wrapper">
      <Header />
      <div className="main">
        {children}
      </div>
      <Footer />
    </div>
  )
}
