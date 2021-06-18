const Snacks = require("../models/snacks");

// To display the newly added menus
const getNewlyAdded = async (req, res) => {
  try {
    const menu = await Snacks.find({});
    const sortedmenu = menu.sort(
      (obj1, obj2) => obj2.createdOn - obj1.createdOn
    );
    const newlyadded = sortedmenu.slice(0, 8);
    res.render("user/index", {
      menu: newlyadded,
      user: req.user,
    });
  } catch (err) {
    res.status(500).send(err);
  }
};

// To display the full menu 
const getMenu = async (req, res) => {
  result = await Snacks.find({});
  res.render("user/full_menu", {
    menu: result,
    user: req.user,
  });
};

module.exports.getMenu = getMenu;
module.exports.getNewlyAdded = getNewlyAdded;
